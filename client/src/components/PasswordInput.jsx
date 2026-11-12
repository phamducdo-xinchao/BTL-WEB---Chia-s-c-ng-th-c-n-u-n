import { useState } from 'react';

// Ô mật khẩu có nút Hiện/Ẩn
export default function PasswordInput(props) {
  const [show, setShow] = useState(false);
  return (
    <span className="pw-wrap">
      <input {...props} type={show ? 'text' : 'password'} />
      <button type="button" className="pw-toggle" onClick={() => setShow(!show)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
        {show ? 'Ẩn' : 'Hiện'}
      </button>
    </span>
  );
}
