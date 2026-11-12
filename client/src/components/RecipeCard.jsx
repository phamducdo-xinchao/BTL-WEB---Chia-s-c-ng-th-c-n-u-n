import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORY_STYLE } from '../constants.js';

export default function RecipeCard({ recipe }) {
  const [broken, setBroken] = useState(false);
  const style = CATEGORY_STYLE[recipe.category] || { icon: '🍽️', tint: '#e5e9e1' };

  return (
    <Link to={`/recipes/${recipe._id}`} className="card">
      <div className="card-media" style={{ background: style.tint }}>
        {recipe.imageUrl && !broken ? (
          <img src={recipe.imageUrl} alt={recipe.title} loading="lazy" onError={() => setBroken(true)} />
        ) : (
          <span className="card-icon" aria-hidden="true">{style.icon}</span>
        )}
        <span className="badge">{recipe.category}</span>
      </div>
      <div className="card-body">
        <h3>{recipe.title}</h3>
        {recipe.description && <p className="card-desc">{recipe.description}</p>}
        <div className="card-meta">
          {recipe.ratingCount > 0 && <span className="card-rating">★ {recipe.ratingAvg} ({recipe.ratingCount})</span>}
          <span>{recipe.cookTime} phút</span>
          <span>{recipe.likesCount} lượt thích</span>
          <span>{recipe.author?.name}</span>
        </div>
      </div>
    </Link>
  );
}
