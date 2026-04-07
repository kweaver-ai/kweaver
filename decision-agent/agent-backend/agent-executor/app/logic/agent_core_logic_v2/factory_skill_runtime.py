"""Remote skill runtime adapter for online mode.

This module encapsulates the three-phase progressive loading logic for
execution-factory skills:

1. load_skill(skill_id)
   -> GET /skills/{skill_id}/content
   -> download SKILL.md text
   -> return unified result

2. read_skill_file(skill_id, file_path)
   -> path format + ownership validation
   -> POST /skills/{skill_id}/files/read
   -> download file text
   -> return unified result

3. execute_skill_script(skill_id, script_path)
   -> path format + ownership validation
   -> POST /skills/{skill_id}/scripts/execute
   -> return unified structured result

This layer does NOT cache results and is NOT directly visible to the model.
It is called by FactorySkillLoadTool / FactorySkillReadTool / FactorySkillExecuteTool.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from app.common.stand_log import StandLogger
from app.driven.dip.agent_factory_service import AgentFactoryService

# Reuse path validation from the SDK's skill_validator to avoid duplicating rules.
# These are the same checks used by the local resource_skillkit handlers.
from dolphin.lib.skillkits.resource.skill_validator import (
    validate_skill_file_path as _validate_file_path,
    validate_skill_script_path as _validate_script_path,
)


def _normalize_path(path: str) -> str:
    """Normalize path separators to forward-slash."""
    return path.replace("\\", "/")


def _extract_path_lists(files: List[Dict[str, Any]]) -> Tuple[List[str], List[str]]:
    """Extract available_scripts and available_references from a files[] list.

    Args:
        files: List of SkillFileSummary dicts from the content API response

    Returns:
        (available_scripts, available_references)
    """
    scripts: List[str] = []
    references: List[str] = []

    for f in files or []:
        rel = f.get("rel_path", "")
        if rel.startswith("scripts/"):
            scripts.append(rel)
        elif rel.startswith("references/"):
            references.append(rel)

    return scripts, references


def _ownership_check(
    path: str, files: List[Dict[str, Any]], allow_skill_md: bool = True
) -> Tuple[bool, Optional[str]]:
    """Check that a path belongs to the given file list.

    Args:
        path: Normalized relative path to check
        files: List of SkillFileSummary dicts (rel_path field)
        allow_skill_md: Whether to always allow 'SKILL.md' as a special entry

    Returns:
        (is_allowed, error_message)
    """
    if allow_skill_md and path == "SKILL.md":
        return True, None

    known = {f.get("rel_path", "") for f in files or []}
    if path not in known:
        return False, (
            f"Path '{path}' does not belong to this skill. "
            f"Available paths: {sorted(known)}"
        )
    return True, None


# ---------------------------------------------------------------------------
# Runtime functions
# ---------------------------------------------------------------------------


async def load_skill(
    service: AgentFactoryService,
    skill_id: str,
    request_headers: Optional[dict] = None,
) -> Dict[str, Any]:
    """Phase 1: Load skill entry information.

    Calls GET /skills/{skill_id}/content, downloads SKILL.md text, and
    returns a unified result dict.

    Args:
        service: Configured AgentFactoryService instance
        skill_id: Execution-factory skill identifier
        request_headers: Per-request auth headers forwarded to each service call.
            Passing these explicitly prevents header bleed when the singleton
            service is shared across concurrent async requests.

    Returns:
        Unified response dict with skill_md_content, available_scripts,
        available_references, source='factory'
    """
    # Step 1: Fetch skill content index.
    # Any service exception (HTTP error, network timeout, etc.) is caught here
    # and converted to a structured error result so the model always receives a
    # well-formed contract response rather than an unhandled exception.
    try:
        content_data = await service.get_skill_content(
            skill_id, request_headers=request_headers
        )
    except Exception as exc:
        err = f"builtin_skill_load failed for skill '{skill_id}': {exc}"
        StandLogger.error(err)
        return _error_result_load(skill_id, err)

    skill_md_url: str = content_data.get("url", "")
    files: List[Dict[str, Any]] = content_data.get("files", [])

    # Step 2: Extract path lists
    available_scripts, available_references = _extract_path_lists(files)

    # Step 3: Download SKILL.md content.
    # An absent URL means the factory returned an unexpected response; treat
    # this as a hard failure rather than silently returning an empty skill.
    # Returning empty content would make the model believe the skill exists
    # but has no instructions, leading to incorrect downstream decisions.
    if not skill_md_url:
        err = (
            f"builtin_skill_load failed for skill '{skill_id}': "
            "the content API returned no SKILL.md download URL. "
            "The skill may not exist or may not be ready yet."
        )
        StandLogger.error(err)
        return _error_result_load(skill_id, err)

    try:
        skill_md_content = await service.read_downloaded_skill_text(
            skill_md_url, "SKILL.md"
        )
    except Exception as exc:
        err = f"builtin_skill_load: failed to download SKILL.md for '{skill_id}': {exc}"
        StandLogger.error(err)
        return _error_result_load(skill_id, err)

    result = {
        "skill_id": skill_id,
        "skill_md_content": skill_md_content,
        "available_scripts": available_scripts,
        "available_references": available_references,
        "source": "factory",
    }
    return {"answer": result, "block_answer": result}


async def read_skill_file(
    service: AgentFactoryService,
    skill_id: str,
    file_path: str,
    request_headers: Optional[dict] = None,
) -> Dict[str, Any]:
    """Phase 2: Read a single file from the skill package.

    Validates the path, calls POST /skills/{skill_id}/files/read, downloads
    the file content, and returns a unified result dict.

    Args:
        service: Configured AgentFactoryService instance
        skill_id: Execution-factory skill identifier
        file_path: Relative file path inside the skill package
        request_headers: Per-request auth headers (see load_skill for rationale).

    Returns:
        Unified response dict with file content and source='factory'
    """
    # Step 1: Path format validation
    is_valid, error = _validate_file_path(file_path)
    if not is_valid:
        return _error_result_read(skill_id, file_path, error)

    normalized = _normalize_path(file_path.strip())

    # Step 2: Ownership validation — re-fetch file list if needed.
    # (Caller may not have cached the file list from a prior load_skill call.)
    try:
        content_data = await service.get_skill_content(
            skill_id, request_headers=request_headers
        )
    except Exception as exc:
        err = (
            f"builtin_skill_read_file: failed to fetch file list for "
            f"skill '{skill_id}': {exc}"
        )
        StandLogger.error(err)
        return _error_result_read(skill_id, file_path, err)

    files = content_data.get("files", [])

    is_allowed, ownership_error = _ownership_check(normalized, files)
    if not is_allowed:
        return _error_result_read(skill_id, file_path, ownership_error)

    # Step 3: Fetch file download URL
    try:
        file_meta = await service.read_skill_file_meta(
            skill_id, normalized, request_headers=request_headers
        )
    except Exception as exc:
        err = (
            f"builtin_skill_read_file: failed to get download URL for "
            f"'{file_path}' in skill '{skill_id}': {exc}"
        )
        StandLogger.error(err)
        return _error_result_read(skill_id, file_path, err)

    file_url: str = file_meta.get("url", "")
    mime_type: str = file_meta.get("mime_type", "")
    file_type: str = file_meta.get("file_type", "")

    if not file_url:
        return _error_result_read(
            skill_id, file_path, f"No download URL returned for '{file_path}'"
        )

    # Step 4: Download file content (binary files are rejected inside this call)
    try:
        content_text = await service.read_downloaded_skill_text(
            file_url, file_path, mime_type=mime_type, file_type=file_type
        )
    except Exception as exc:
        err = (
            f"builtin_skill_read_file: failed to download '{file_path}' "
            f"in skill '{skill_id}': {exc}"
        )
        StandLogger.error(err)
        return _error_result_read(skill_id, file_path, err)

    result = {
        "skill_id": skill_id,
        "file_path": file_path,
        "content": content_text,
        "source": "factory",
    }
    return {"answer": result, "block_answer": result}


async def execute_skill_script(
    service: AgentFactoryService,
    skill_id: str,
    script_path: str,
    request_headers: Optional[dict] = None,
) -> Dict[str, Any]:
    """Phase 3: Execute a script inside the execution factory sandbox.

    Validates the path, checks ownership, calls
    POST /skills/{skill_id}/scripts/execute, and returns a unified result dict.

    Args:
        service: Configured AgentFactoryService instance
        skill_id: Execution-factory skill identifier
        script_path: Relative script path (must be under scripts/)
        request_headers: Per-request auth headers (see load_skill for rationale).

    Returns:
        Unified response dict with stdout, stderr, exit_code, duration_ms,
        artifacts, source='factory'
    """
    # Step 1: Path format validation
    is_valid, error = _validate_script_path(script_path)
    if not is_valid:
        return _error_result_exec(skill_id, script_path, error)

    normalized = _normalize_path(script_path.strip())

    # Step 2: Ownership validation
    try:
        content_data = await service.get_skill_content(
            skill_id, request_headers=request_headers
        )
    except Exception as exc:
        err = (
            f"builtin_skill_execute_script: failed to fetch file list for "
            f"skill '{skill_id}': {exc}"
        )
        StandLogger.error(err)
        return _error_result_exec(skill_id, script_path, err)

    files = content_data.get("files", [])

    is_allowed, ownership_error = _ownership_check(
        normalized, files, allow_skill_md=False
    )
    if not is_allowed:
        return _error_result_exec(skill_id, script_path, ownership_error)

    # Step 3: Execute script in factory sandbox
    try:
        exec_data = await service.execute_skill_script(
            skill_id, normalized, request_headers=request_headers
        )
    except Exception as exc:
        err = (
            f"builtin_skill_execute_script: factory execution failed for "
            f"'{script_path}' in skill '{skill_id}': {exc}"
        )
        StandLogger.error(err)
        return _error_result_exec(skill_id, script_path, err)

    result = {
        "skill_id": skill_id,
        "script_path": script_path,
        "stdout": exec_data.get("stdout", ""),
        "stderr": exec_data.get("stderr", ""),
        "exit_code": exec_data.get("exit_code", -1),
        "duration_ms": exec_data.get("duration_ms", 0),
        "artifacts": exec_data.get("artifacts", []),
        "source": "factory",
    }
    return {"answer": result, "block_answer": result}


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------


def _error_result_load(skill_id: str, message: str) -> Dict[str, Any]:
    """Build a unified error response for load_skill failures."""
    result = {
        "skill_id": skill_id,
        "skill_md_content": "",
        "available_scripts": [],
        "available_references": [],
        "error": message,
        "source": "factory",
    }
    return {"answer": result, "block_answer": result}


def _error_result_read(
    skill_id: str, file_path: str, message: str
) -> Dict[str, Any]:
    """Build a unified error response for read_skill_file failures."""
    result = {
        "skill_id": skill_id,
        "file_path": file_path,
        "content": "",
        "error": message,
        "source": "factory",
    }
    return {"answer": result, "block_answer": result}


def _error_result_exec(
    skill_id: str, script_path: str, message: str
) -> Dict[str, Any]:
    """Build a unified error response for execute_skill_script failures."""
    result = {
        "skill_id": skill_id,
        "script_path": script_path,
        "stdout": "",
        "stderr": message,
        "exit_code": -1,
        "duration_ms": 0,
        "artifacts": [],
        "source": "factory",
    }
    return {"answer": result, "block_answer": result}
