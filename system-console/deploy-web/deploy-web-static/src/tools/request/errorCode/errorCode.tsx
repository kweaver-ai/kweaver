/*
 * @File: 错误详情弹窗
 * @Author: Ximena.zhou
 * @Date: 2022-09-14 10:38:16
 */
import React, { useEffect, useState } from 'react'
import styles from './styles.module.less'
import __ from '../locale'

/**
 * @interface
 * @description: 错误组件配置属性
 * @param details 详情内容，如果没有后端传递errorCode为undefiend，就显示details
 * @param errorCode 错误码，用于获取json文件
 * @param errorArgs 错误参数，用于解析错误描述、处理建议中的标志位参数
 * @param cause 错误原因，拼接在错误原因模块中
 * @param description 固定错误描述，用于显示不从错误码中解析的错误描述
 */
interface IProps {
    errorCode: string
    cause: string
    description: string
}
const ErrorCode: React.FC<IProps> = (props) => {
    const [isOpen, setIsOpen] = useState(false)
    const [errorInfo, setErrorInfo] = useState(props)

    // 点击展开/收起
    const changeStatus = () => {
        setIsOpen(!isOpen)
    }

    return (
        <React.Fragment>
            {errorInfo.errorCode && (
                <div className={styles["error-code-container"]}>
                    <div className={styles["res-error-content"]}>
                        {errorInfo.description !== '' && (
                            <React.Fragment>
                                {/* 错误描述 */}
                                <div className={styles["error-spot"]}>
                                    <p className={styles["error-content"]}>{errorInfo.description}</p>
                                    {/* 原因 */}
                                    {errorInfo.cause && (
                                        <p className={styles["error-content"]}>
                                            {__('原因：${cause}', {cause: errorInfo.cause })}
                                        </p>
                                    )}
                                </div>
                            </React.Fragment>
                        )}
                    </div>
                </div>
            )}
        </React.Fragment>
    )
}
export default ErrorCode
