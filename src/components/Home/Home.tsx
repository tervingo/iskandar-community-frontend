import React from 'react';
import bibliotecaImage from '../../assets/images/biblioteca.jpg';

const Home: React.FC = () => {
  return (
    <div className="home-page">
      <div className="home-content">
        <h1 className="home-title">Iskandar</h1>
        
        <div className="home-image-container">
          <img 
            src={bibliotecaImage} 
            alt="Biblioteca" 
            className="home-image"
          />
        </div>
        
        <div className="home-description">
          {/* 
            Replace this placeholder text with your explanation about the library.
            You can add multiple paragraphs by using multiple <p> tags.
          */}
          <p>
            [Your explanation text about the biblioteca will go here. You can replace this entire 
            paragraph with your own content about the library and community.]
          </p>
          
          {/* 
            Example of how to add more paragraphs:
            <p>Add another paragraph here if needed.</p>
            <p>And another one here.</p>
          */}
        </div>
      </div>
    </div>
  );
};

export default Home;