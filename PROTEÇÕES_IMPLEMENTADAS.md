# 🔒 Proteções de Segurança Implementadas

## Visão Geral

Foram implementadas várias camadas de proteção para dificultar a captura e cópia não autorizada das fotos do site. Embora **nenhuma proteção seja 100% inviolável**, essas medidas criam obstáculos significativos para usuários comuns.

## 🛡️ Proteções Implementadas

### 1. Marca d'Água Automática
- **Como funciona**: Adiciona automaticamente uma marca d'água transparente sobre cada imagem
- **Conteúdo da marca**: Email do usuário logado + data/hora de visualização
- **Posicionamento**: Múltiplas marcas d'água rotacionadas em toda a imagem
- **Resultado**: Mesmo se capturada, a imagem conterá identificação do usuário

### 2. Proteção Anti-Screenshot
- **Detecção de teclas**: Monitora Print Screen, Ctrl+Shift+S, F12, etc.
- **Blur temporário**: Aplica desfoque na tela quando detecta tentativa de captura
- **Alertas**: Mostra notificação sobre atividade suspeita
- **Detecção DevTools**: Identifica quando ferramentas de desenvolvedor são abertas

### 3. Proteções de Interface
- **Clique direito desabilitado**: Impede menu contextual nas imagens
- **Drag & drop bloqueado**: Impossibilita arrastar imagens
- **Seleção de texto desabilitada**: Previne seleção e cópia
- **Overlay invisível**: Camada transparente sobre as imagens

### 4. Proteções CSS Avançadas
- **user-select: none**: Desabilita seleção via CSS
- **pointer-events**: Controla interações do mouse
- **Proteção para impressão**: Oculta conteúdo sensível ao imprimir

## ⚡ Como as Proteções Funcionam

### Fluxo de Proteção:
1. **Carregamento da imagem** → Adiciona marca d'água automaticamente
2. **Exibição** → Aplica proteções CSS e overlay
3. **Interação do usuário** → Monitora tentativas suspeitas
4. **Detecção de captura** → Ativa blur temporário + alerta

### Eventos Monitorados:
- **Print Screen** (PrtSc)
- **Atalhos de screenshot** (Cmd+Shift+3/4/5 no macOS)
- **DevTools** (F12, Ctrl+Shift+I)
- **Perda de foco** da janela (possível alt+tab para captura)
- **Redimensionamento** suspeito da janela

## 🔧 Limitações Técnicas

### ⚠️ **IMPORTANTE: Limitações das Proteções**

1. **Screenshots de tela inteira**: Usuários ainda podem capturar a tela inteira
2. **Celular/tablet**: Capturas nativas do dispositivo são mais difíceis de detectar
3. **Câmera externa**: Foto da tela com câmera/celular não é detectável
4. **JavaScript desabilitado**: Proteções não funcionam se JS estiver off
5. **Navegadores alternativos**: Alguns navegadores podem ignorar certas proteções

### 💡 **O que as proteções FAZEM:**
- ✅ Adicionam marca d'água identificando o usuário
- ✅ Dificultam captura para usuários comuns
- ✅ Criam evidência de quem acessou a imagem
- ✅ Desencorajam tentativas de cópia
- ✅ Alertam sobre atividades suspeitas

### ❌ **O que as proteções NÃO fazem:**
- ❌ Não bloqueiam 100% das capturas
- ❌ Não protegem contra usuários técnicos avançados
- ❌ Não funcionam com JavaScript desabilitado
- ❌ Não impedem fotos da tela com câmera externa

## 🎯 Recomendações Adicionais

### Para Máxima Segurança:
1. **Watermark personalizada**: Considere marca d'água mais visível
2. **Resolução reduzida**: Disponibilize apenas versões de baixa qualidade
3. **Acesso controlado**: Sistema de aprovação rigoroso
4. **Monitoramento de logs**: Rastreie quem acessa quais fotos
5. **Termos de uso**: Documento legal sobre uso das imagens

### Configurações Recomendadas:
- Aprovar apenas usuários conhecidos
- Revisar regularmente a lista de usuários aprovados
- Considerar sistema de download pago/controlado
- Implementar logs de acesso detalhados

## 🔍 Monitoramento

O sistema registra:
- **Tentativas de captura detectadas**
- **Usuário que acessou cada foto**
- **Timestamp de cada acesso**
- **Alertas de atividade suspeita**

## 📞 Suporte

Para questões sobre as proteções implementadas ou sugestões de melhorias, entre em contato com o administrador do sistema.

---

**Lembre-se**: Essas proteções criam obstáculos e identificam usuários, mas não são uma solução 100% infalível. A melhor proteção é sempre o controle criterioso de acesso.