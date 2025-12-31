/** dsl计算公式默认值 */

export const dslFormulaDefault = {
  size: 0,
  query: {
    bool: {
      filter: [],
    },
  },
  aggs: {
    '<terms-aggs-name>': {
      terms: {
        field: '<terms-field-name>.keyword',
        size: 10000,
      },
      aggs: {
        '<date_histogram_name>': {
          date_histogram: {
            field: '@timestamp',
            fixed_interval: '{{__interval}}',
            min_doc_count: 1,
            order: {
              _key: 'asc',
            },
          },
          aggs: {
            '<metric-aggs-name>': {
              value_count: {
                field: '@timestamp',
              },
            },
          },
        },
      },
    },
  },
};
