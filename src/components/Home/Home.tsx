import React from 'react';
import bibliotecaImage from '../../assets/images/iskandariya.jpg';

const Home: React.FC = () => {
  return (
    <div className="home-page">
      <div className="home-content">
        <h1 className="home-title">Yskandar</h1>
        
        <div className="home-image-container">
          <img 
            src={bibliotecaImage} 
            alt="Biblioteca" 
            className="home-image"
          />
        </div>
        
        <div className="home-description-iskandar">
          {/* 
            Replace this placeholder text with your explanation about the library.
            You can add multiple paragraphs by using multiple <p> tags.
          */}
            <p><b>Yskandar</b> es el nombre en árabe para Alejandro, e <b>Yskandariya</b> es el nombre para la ciudad de Alejandría, donde estaba 
            la biblioteca más famosa del mundo, la <b>biblioteca de Alejandría</b>. </p>

        </div>
        <div className="home-description-community">
            <p>Este sitio pretende ser una comunidad virtual donde poder compartir información, opinión y conocimiento.</p>
          {/* 
            Example of how to add more paragraphs:
            <p>Agrega otro párrafo aquí si es necesario.</p>
            <p>Y otro más aquí.</p>
          */}
        </div>
      </div>
    </div>
  );
};

export default Home;