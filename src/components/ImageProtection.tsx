import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ImageProtectionProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
}

export const ImageProtection: React.FC<ImageProtectionProps> = ({ 
  src, 
  alt, 
  className = "", 
  onLoad 
}) => {
  const { user } = useAuth();
  const [protectedImageUrl, setProtectedImageUrl] = useState<string>('');

  useEffect(() => {
    const addWatermark = async () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Desenhar a imagem original
          ctx!.drawImage(img, 0, 0);
          
          // Configurar marca d'água
          const watermarkText = '@fotosvolei';
          const watermarkText2 = 'PROIBIDO REPRODUÇÃO';
          const fontSize = Math.min(img.width, img.height) / 25;
          
          ctx!.font = `${fontSize}px Arial`;
          ctx!.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx!.strokeStyle = 'rgba(0, 0, 0, 0.3)';
          ctx!.lineWidth = 2;
          ctx!.textAlign = 'center';
          
          // Adicionar múltiplas marcas d'água mais sutis
          ctx!.font = `${fontSize}px Arial`;
          ctx!.fillStyle = 'rgba(255, 255, 255, 0.4)'; // Mais opaco
          ctx!.strokeStyle = 'rgba(0, 0, 0, 0.4)'; // Mais opaco
          ctx!.lineWidth = 2; // Mais espesso
          ctx!.textAlign = 'center';
          
          // Marcas d'água distribuídas pela imagem
          for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 2; y++) {
              ctx!.save();
              ctx!.translate((x + 0.5) * img.width / 3, (y + 0.5) * img.height / 2);
              ctx!.rotate(-Math.PI / 6);
              
              // Primeira linha - @fotosvolei
              ctx!.strokeText(watermarkText, 0, -10);
              ctx!.fillText(watermarkText, 0, -10);
              
              // Segunda linha - PROIBIDO REPRODUÇÃO
              ctx!.font = `${fontSize * 0.7}px Arial`;
              ctx!.strokeText(watermarkText2, 0, 10);
              ctx!.fillText(watermarkText2, 0, 10);
              ctx!.font = `${fontSize}px Arial`;
              
              ctx!.restore();
            }
          }
          
          // Adicionar data e hora menor e menos visível
          const now = new Date().toLocaleString('pt-BR');
          ctx!.font = `${fontSize * 0.4}px Arial`;
          ctx!.fillStyle = 'rgba(255, 0, 0, 0.2)'; // Mais transparente
          ctx!.fillText(now, img.width - 100, img.height - 10);
          
          // Converter para URL
          const dataURL = canvas.toDataURL('image/jpeg', 0.8);
          setProtectedImageUrl(dataURL);
          onLoad?.();
        };
        
        img.src = src;
      } catch (error) {
        console.error('Erro ao adicionar marca d\'água:', error);
        setProtectedImageUrl(src);
        onLoad?.();
      }
    };

    addWatermark();
  }, [src, user?.email, onLoad]);

  // Prevenir drag and drop
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  // Prevenir clique direito
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  // Prevenir seleção
  const handleSelectStart = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  return (
    <div className="relative group">
      {protectedImageUrl && (
        <img
          src={protectedImageUrl}
          alt={alt}
          className={`select-none ${className}`}
          onDragStart={handleDragStart}
          onContextMenu={handleContextMenu}
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            WebkitTouchCallout: 'none'
          } as React.CSSProperties}
        />
      )}
      
      {/* Overlay invisível para prevenir cliques */}
      <div 
        className="absolute inset-0 z-10 bg-transparent cursor-pointer"
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
      />
      
      {/* Indicador de proteção menos visível */}
      <div className="absolute top-2 right-2 bg-red-500/20 text-white px-1 py-0.5 text-xs rounded opacity-30 hover:opacity-60 transition-opacity">
        🔒
      </div>
    </div>
  );
};