export const getUserId = () => {
  let id = localStorage.getItem("poker_user_id");
  if (!id) {
    id = Math.random().toString(36).substring(2, 10);
    localStorage.setItem("poker_user_id", id);
  }
  return id;
};

export const myUserId = getUserId();

export const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};