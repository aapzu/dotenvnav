export const askOnce = () => {
  const stdin = process.stdin;

  stdin.resume();

  return new Promise<string>((resolve) => {
    stdin.once('data', function (data) {
      stdin.pause();
      resolve(data.toString().trim());
    });
  });
};
