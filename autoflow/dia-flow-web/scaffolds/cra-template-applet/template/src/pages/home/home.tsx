import React from "react";
import { Layout } from "antd";
import styles from "./home.module.less";

export function Home() {
    return (
        <Layout className={styles.home}>
            <Layout.Header className={styles.header}>Home</Layout.Header>
            <Layout className={styles.main}>Hello World</Layout>
        </Layout>
    );
}
