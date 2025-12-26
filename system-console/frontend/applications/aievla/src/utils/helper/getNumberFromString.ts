export default (str: string): number => {
  const match = str.match(/\d+(\.\d+)?/)!;
  return parseFloat(match[0]);
};
