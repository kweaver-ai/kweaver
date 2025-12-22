from typing import Callable
from prompt_toolkit import prompt, HTML
from prompt_toolkit import print_formatted_text as print
from prompt_toolkit.formatted_text import FormattedText
from prompt_toolkit.styles import Style

from pygments.token import Token
from prompt_toolkit import PromptSession

from data_retrieval.agents.base import BaseAgent
import traceback
import time

async def astart_repl(
        session_id: str,
        prompt_prefix: str = "Your question: > ",
        agent: BaseAgent = None,
        agent_getter: Callable = None,
        verbose: bool = False
):
    if agent is None and agent_getter is None:
        raise ValueError("agent or agent_getter must be provided")

    prompt_session = PromptSession()
    while True:
        try:
            text = await prompt_session.prompt_async(
                prompt_prefix,
            )
            if text == 'q':
                print('Bye!')
                break
            if text.strip() == "":
                continue

            if agent_getter is not None:
                # create new agent every time to simulate stateless service
                agent = agent_getter()

            agent_session = agent.session

            res = agent.astream_events(
                text,
                session_id=session_id
            )

            start_time = time.time()
            async for event in res:
                if verbose:
                    print("## #########" * 9)
                    print(event)
                    print("************" * 9)
                end_time = time.time()
                print(f"Time taken: {end_time - start_time} seconds")

            time.sleep(0.1)
            print(agent_session.get_chat_history(session_id))
            end_time = time.time()
            print(f"Time taken: {end_time - start_time} seconds")
                
        except KeyboardInterrupt:
            print("type 'q' to quit")
            continue
        except EOFError:
            continue
        except Exception as e:
            traceback.print_exc(e)
            continue

def start_repl(agent: BaseAgent, session_id: str, prompt_prefix: str = "Your question: > "):
    prompt_session = PromptSession()
    while True:
        try:
            text = prompt_session.prompt(prompt_prefix)
            if text == 'q':
                print('Bye!')
                break
            if text.strip() == "":
                continue
            res = agent.stream_events(
                text,
                session_id=session_id
            )
            for event in res:
                print("## #########" * 9)
                print(event)
        except KeyboardInterrupt:
            print("type 'q' to quit")
            continue
        except EOFError:
            continue
