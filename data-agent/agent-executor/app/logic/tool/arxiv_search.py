import arxiv
import PyPDF2


async def arxiv_search_run_func(
    inputs, props, resource, data_source_config, context=None
):
    return {
        "papers": await arxiv_search(
            inputs["keyword"], inputs["nums"], inputs["params_format"]
        )
    }


async def arxiv_search(keyword="", nums=1, params_format=False):
    if params_format:
        return ["keyword", "nums"]
    client = arxiv.Client()
    if nums > 20:
        nums = 20
    search = arxiv.Search(
        query=keyword, max_results=nums, sort_by=arxiv.SortCriterion.SubmittedDate
    )
    papers = []
    for r in client.results(search):
        try:
            down_load_path = r.download_pdf("../pdf_path")
            pdf_text = await read_pdf(down_load_path)
            papers.append(
                {
                    "title": r.title,
                    "authors": r.authors,
                    "published": r.published,
                    "summary": r.summary,
                    "pdf_text": pdf_text,
                    "down_load_path": down_load_path,
                }
            )
        except Exception as e:
            print(e)
            # papers.append(
            #   {
            #     "title": r.title,
            #     "authors": r.authors,
            #     "published": r.published,
            #     "summary": r.summary,
            #     "pdf_text": r.summary,
            #     "down_load_path": down_load_path
            #   }
            # )
    return papers


async def read_pdf(path):
    with open(path, "rb") as f:
        pdf_reader = PyPDF2.PdfReader(f)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text


async def main():
    results = await arxiv_search("RAG", 1, False)
    print(results)


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
