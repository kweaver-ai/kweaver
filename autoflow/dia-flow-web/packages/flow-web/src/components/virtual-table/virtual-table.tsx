import React, { useState, useEffect, useRef, useMemo } from "react";
import { VariableSizeGrid as _Grid } from "react-window";
import ResizeObserver from "rc-resize-observer";
import { Table } from "antd";
import clsx from "clsx";
import { clamp } from "lodash";
import "./virtual-table.css";

const Grid = _Grid as any;

export function VirtualTable(props: Parameters<typeof Table>[0]) {
    const { columns, scroll } = props;
    const [tableWidth, setTableWidth] = useState(0);
    const [scrollbarWidth, setScrollbarWidth] = useState(8);

    const isScroll = useMemo(() => {
        if (
            props.dataSource?.length &&
            props.dataSource.length * 50 > Number(scroll?.y)
        ) {
            return true;
        }
        return false;
    }, [props?.dataSource?.length, scroll?.y]);

    const addHoverStyle = (rowHoverIndex: number) => {
        let style = document.getElementById("content-automation-virtual-grid");
        const styleContent = `
            .virtual-table .virtual-table-cell.virtual-table-cell-row-${rowHoverIndex}{
                background: rgba(166, 169, 181, 0.11);
            }
        `;
        if (!style) {
            style = document.createElement("style");
            style.setAttribute("type", "text/css");
            style.id = "content-automation-virtual-grid";
            style.textContent = styleContent;

            document.head.appendChild(style);
        } else {
            style.textContent = styleContent;
        }
    };

    const removeHoverStyle = () => {
        const style = document.getElementById("content-automation-virtual-grid");
        if (style) {
            style.textContent = "";
        }
    };

    let responsiveWidth = isScroll
        ? // 避免在IE上获取scrollbarWidth时影响宽度计算
          tableWidth - clamp(scrollbarWidth, 0, 40) - 1
        : tableWidth;
    const widthColumnCount = columns!.filter(({ width }) => {
        if (width) {
            responsiveWidth -= Number(width);
        }
        return !width;
    }).length;
    const mergedColumns = columns!.map((column) => {
        if (column.width) {
            return column;
        }
        return {
            ...column,
            width: Math.floor(responsiveWidth / widthColumnCount),
        };
    });

    const gridRef = useRef<any>();
    const [connectObject] = useState<any>(() => {
        const obj = {};
        Object.defineProperty(obj, "scrollLeft", {
            get: () => {
                if (gridRef.current) {
                    return gridRef.current?.state?.scrollLeft;
                }
                return null;
            },
            set: (scrollLeft: number) => {
                if (gridRef.current) {
                    gridRef.current.scrollTo({ scrollLeft });
                }
            },
        });

        return obj;
    });

    const resetVirtualGrid = () => {
        gridRef.current?.resetAfterIndices({
            columnIndex: 0,
            shouldForceUpdate: true,
        });
    };

    useEffect(() => resetVirtualGrid, [tableWidth, isScroll]);

    const renderVirtualList = (
        rawData: readonly object[],
        { scrollbarSize, ref, onScroll }: any
    ) => {
        ref.current = connectObject;
        if (scrollbarSize !== scrollbarWidth) {
            setScrollbarWidth(scrollbarSize);
        }

        return (
            <Grid
                ref={gridRef}
                className="virtual-grid"
                columnCount={mergedColumns.length}
                columnWidth={(index: number) => {
                    const { width } = mergedColumns[index];
                    return width as number;
                }}
                height={scroll!.y as number}
                rowCount={rawData.length}
                rowHeight={() => 50}
                width={tableWidth}
                onScroll={({ scrollLeft }: { scrollLeft: number }) => {
                    onScroll({ scrollLeft });
                }}
            >
                {({
                    columnIndex,
                    rowIndex,
                    style,
                }: {
                    columnIndex: number;
                    rowIndex: number;
                    style: React.CSSProperties;
                }) => (
                    <div
                        className={[
                            "virtual-table-cell",
                            `virtual-table-cell-row-${rowIndex}`,
                            columnIndex === mergedColumns.length - 1
                                ? "virtual-table-cell-last"
                                : "",
                        ]
                            .filter(Boolean)
                            .join(" ")}
                        style={style}
                        onMouseEnter={() => {
                            addHoverStyle(rowIndex);
                        }}
                        onMouseLeave={() => {
                            removeHoverStyle();
                        }}
                    >
                        {mergedColumns[columnIndex].hasOwnProperty("render")
                            ? (mergedColumns[columnIndex] as any).render(
                                  (rawData[rowIndex] as any)[
                                      (mergedColumns as any)[columnIndex]
                                          .dataIndex
                                  ],
                                  rawData[rowIndex] as any,
                                  columnIndex
                              )
                            : (rawData[rowIndex] as any)[
                                  (mergedColumns as any)[columnIndex].dataIndex
                              ]}
                    </div>
                )}
            </Grid>
        );
    };

    return (
        <ResizeObserver
            onResize={({ width }) => {
                setTableWidth(width);
            }}
        >
            <Table
                {...props}
                className={clsx(
                    "virtual-table",
                    props?.className ? props.className : ""
                )}
                columns={mergedColumns}
                pagination={false}
                components={{
                    body: renderVirtualList,
                }}
            />
        </ResizeObserver>
    );
}
