export default function Avatar({ user, size = 40 }) {
  const letter = (user?.first_name || user?.username || "?").trim().charAt(0).toUpperCase();
  return user?.avatar_url ? (
    <img className="avatar" src={user.avatar_url} alt="" width={size} height={size} style={{ width: size, height: size }} />
  ) : (
    <span className="avatar avatar-fallback" aria-hidden="true" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {letter}
    </span>
  );
}
