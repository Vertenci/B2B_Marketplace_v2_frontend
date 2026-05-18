import { Link } from 'react-router-dom';
import { Button } from '../common/Button';

export const GuestHeader = () => {
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-2 flex gap-2 shadow-xl">
        <Link to="/login">
          <Button variant="outline" className="!px-8">
            Войти
          </Button>
        </Link>
        <Link to="/register">
          <Button variant="primary" className="!px-8">
            Регистрация
          </Button>
        </Link>
      </div>
    </div>
  );
};
