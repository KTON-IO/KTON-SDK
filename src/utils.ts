const checkDev = () => {
  if (typeof window === "undefined") {
    return false;
  }
  const location = window.location;

  if (!location) {
    return false;
  }

  const hostname = location.hostname;

  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.includes("preview")
  );
};

export const log = (...args: unknown[]) => {
  if (checkDev()) {
    console.log(...args);
  }
};
