import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, User, Search, X, Loader2 } from 'lucide-react';

interface FaceRecognitionProps {
  photos: Array<{
    id: string;
    storage_path: string;
    original_name: string;
  }>;
  onPhotosFiltered: (photoIds: string[]) => void;
  onClearFilter: () => void;
  isActive: boolean;
}

export const FaceRecognition: React.FC<FaceRecognitionProps> = ({
  photos,
  onPhotosFiltered,
  onClearFilter,
  isActive
}) => {
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem válida",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro", 
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive"
      });
      return;
    }

    setReferenceImage(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSearch = async () => {
    if (!referenceImage) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma foto de referência",
        variant: "destructive"
      });
      return;
    }

    if (photos.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há fotos para comparar",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Convert reference image to base64
      const referenceBase64 = await convertToBase64(referenceImage);

      // Prepare photos for comparison (limit to 10 to avoid timeouts)
      const photosToCompare = photos.slice(0, 10).map(photo => ({
        id: photo.id,
        url: getPhotoUrl(photo.storage_path),
        name: photo.original_name
      }));

      console.log('Calling face recognition with:', {
        photosCount: photosToCompare.length,
        hasReferenceImage: !!referenceBase64
      });

      // Call edge function for face recognition
      const { data, error } = await supabase.functions.invoke('face-recognition', {
        body: {
          referenceImage: referenceBase64,
          photosToCompare: photosToCompare
        }
      });

      console.log('Face recognition response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        
        // Check specific error types
        if (error.message?.includes('Failed to fetch')) {
          throw new Error('Serviço de reconhecimento facial não está acessível. Verifique sua conexão com a internet.');
        } else if (error.message?.includes('FunctionsError')) {
          throw new Error('Erro na função de reconhecimento facial. Tente novamente em alguns minutos.');
        } else if (error.message?.includes('404')) {
          throw new Error('Função de reconhecimento facial não encontrada. Entre em contato com o suporte técnico.');
        }
        
        throw error;
      }

      if (!data) {
        throw new Error('Resposta vazia do serviço. Tente novamente.');
      }

      const matchingPhotos = data?.matchingPhotos || [];
      const processedCount = data?.processedCount || 0;
      const errorCount = data?.errorCount || 0;

      if (matchingPhotos.length === 0) {
        let message = `Nenhuma foto com essa pessoa foi encontrada (processadas ${processedCount} fotos)`;
        if (errorCount > 0) {
          message += `. Houve ${errorCount} erro(s) durante o processamento.`;
        }
        toast({
          title: "Resultado da busca",
          description: message,
        });
        onPhotosFiltered([]);
      } else {
        let message = `Encontradas ${matchingPhotos.length} foto(s) com essa pessoa (processadas ${processedCount} fotos)`;
        if (errorCount > 0) {
          message += `. Houve ${errorCount} erro(s) durante o processamento.`;
        }
        toast({
          title: "Busca concluída!",
          description: message,
        });
        onPhotosFiltered(matchingPhotos);
      }

    } catch (error) {
      console.error('Error in face recognition:', error);
      
      let errorMessage = "Erro ao processar reconhecimento facial. Tente novamente.";
      
      // Handle different error types more specifically
      if (error?.message?.includes('Failed to fetch') || error?.name === 'FunctionsFetchError') {
        errorMessage = "Serviço de reconhecimento facial temporariamente indisponível. Verifique sua conexão e tente novamente.";
      } else if (error?.message?.includes('404')) {
        errorMessage = "Função de reconhecimento facial não encontrada. Entre em contato com o suporte.";
      } else if (error?.message?.includes('503')) {
        errorMessage = "Serviço da OpenAI temporariamente indisponível. Tente novamente em alguns minutos.";
      } else if (error?.message?.includes('Serviço temporariamente indisponível')) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro no Reconhecimento Facial",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setReferenceImage(null);
    setPreviewUrl(null);
    onClearFilter();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Buscar por Pessoa
          {isActive && (
            <Badge variant="default" className="ml-2">
              Filtro Ativo
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Envie uma foto da pessoa que você quer encontrar nas fotos dos eventos
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isProcessing}
                className="cursor-pointer"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleSearch}
                disabled={!referenceImage || isProcessing}
                className="whitespace-nowrap"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
              
              {(referenceImage || isActive) && (
                <Button
                  variant="outline"
                  onClick={handleClear}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              )}
            </div>
          </div>

          {previewUrl && (
            <div className="mt-3">
              <p className="text-sm font-medium mb-2">Foto de referência:</p>
              <div className="w-24 h-24 rounded-lg overflow-hidden border">
                <img
                  src={previewUrl}
                  alt="Foto de referência"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="text-center py-4">
              <div className="text-sm text-muted-foreground">
                Processando reconhecimento facial...
                <br />
                Analisando até 10 fotos. Isso pode levar alguns minutos.
                <br />
                <div className="mt-2 text-xs opacity-75">
                  ⚠️ Certifique-se que a foto de referência mostra claramente o rosto da pessoa
                </div>
              </div>
            </div>
          )}

          {!isProcessing && !referenceImage && (
            <div className="text-center py-2">
              <div className="text-xs text-muted-foreground">
                💡 Dica: Use uma foto nítida com o rosto bem visível para melhores resultados
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};