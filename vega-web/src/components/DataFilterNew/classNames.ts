/*
 * @Description: className拼接
 * @Author: li.kexin
 * @Date: 2023-05-26 11:13:40
 */

type Params = (string | { [key: string]: boolean })[];

function classNames(...params: Params): string {
  let name = '';

  params.forEach((param) => {
    if (typeof param === 'string') {
      name = `${name} ${this[param]}`;
    }

    if (typeof param === 'object') {
      const keys = Object.keys(param);

      keys.forEach((key) => {
        if (param[key]) {
          name = `${name} ${this[key]}`;
        }
      });
    }
  });

  return name;
}

export default classNames;
