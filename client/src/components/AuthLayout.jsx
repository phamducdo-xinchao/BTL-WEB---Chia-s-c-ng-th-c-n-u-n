// Khung chung cho trang đăng nhập và đăng ký: bên trái giới thiệu, bên phải là form
export default function AuthLayout({ title, subtitle, side, onSubmit, children }) {
  return (
    <div className="auth">
      <aside className="auth-side">
        <h2>{side.heading}</h2>
        <p>{side.text}</p>
        <ul className="auth-points">
          {side.points.map(([icon, text]) => (
            <li key={text}><span className="pt-icon" aria-hidden="true">{icon}</span><span>{text}</span></li>
          ))}
        </ul>
      </aside>
      <form className="auth-form" onSubmit={onSubmit}>
        <div>
          <h1>{title}</h1>
          <p className="sub">{subtitle}</p>
        </div>
        {children}
      </form>
    </div>
  );
}
