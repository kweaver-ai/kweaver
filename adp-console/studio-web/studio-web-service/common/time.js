export const getNow = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const min = date.getMinutes();
    const seconds = date.getSeconds();

    return `${year}/${month}/${day} ${min}:${seconds}`;
}