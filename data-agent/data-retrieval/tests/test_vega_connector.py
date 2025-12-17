from af_agent.datasource.vega_connector import Connection

if __name__ == "__main__":
    conn = Connection(
        # base_url="https://192.168.167.13",
        user_id="26baf92c-24a1-11f0-a96d-5ef93e3b97a3",
        view_list=["28a7b4d8-0e37-49f6-bb4f-e7dd97a584d2"],
        # kg_params={
        #     "kg": [{
        #         "kg_id": "12",
        #         "fields": [
        #             "sale"
        #         ]
        #     }]
        # }
        # base_url="https://192.168.188.29",
        # kg_params={
        #     "kg": [{
        #         "kg_id": "67",
        #         "fields": ["sales"]
        #     }]
        # },
        # view_list=["a6db14b5-c669-43a4-b3d1-fb11e4e2eb8f"],
        # token="Bearer ory_at_-R7UXd3i5HqbW1HX4_1ubQao-iOozm5mpJSrjlXx1Aw.IyIgFb-EWYLypyJPy0vwT6FdPF0K9u23BnRzV3-NqTc",
        # vega_type="dip"
    )
    view_details = conn.get_meta_sample_data(with_sample=True)
    print(view_details)

    cur = conn.cursor()
    cur.execute(f"SELECT count(*) FROM {view_details['detail'][0]['path']}")
    print(cur.fetchall())
    cur.close()
    conn.close()