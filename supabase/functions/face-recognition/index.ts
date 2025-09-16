import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log('Face recognition function called:', req.method)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await req.json()
    const { referenceImage, photosToCompare } = body
    
    console.log('Received request with:', { 
      hasReferenceImage: !!referenceImage, 
      photosCount: photosToCompare?.length 
    })
    
    if (!referenceImage || !photosToCompare || !Array.isArray(photosToCompare)) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OpenAI API key not found')
      return new Response(
        JSON.stringify({ error: 'Serviço temporariamente indisponível. Chave da API não configurada.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const matchingPhotos = []
    let processedCount = 0
    let errorCount = 0

    // Process photos one by one to avoid overwhelming the API
    for (const photo of photosToCompare.slice(0, 8)) { // Reduced to 8 for better performance
      try {
        console.log(`Processing photo ${processedCount + 1}/${Math.min(photosToCompare.length, 8)}: ${photo.id}`)
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini', // Using more reliable model
            messages: [
              {
                role: 'system',
                content: 'You are a face recognition expert. Compare the faces in two images and determine if they show the same person. Respond with only "YES" if it\'s clearly the same person or "NO" if it\'s different people or if you cannot clearly identify faces in both images. Be conservative - only say YES if you are confident it\'s the same person.'
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Are these the same person? First image is the reference, second image is to compare:'
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: referenceImage,
                      detail: 'low'
                    }
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: photo.url,
                      detail: 'low'
                    }
                  }
                ]
              }
            ],
            max_tokens: 10,
            temperature: 0
          })
        })

        if (response.ok) {
          const result = await response.json()
          const answer = result.choices?.[0]?.message?.content?.trim()?.toUpperCase()
          
          console.log(`Photo ${photo.id}: ${answer}`)
          
          if (answer === 'YES') {
            matchingPhotos.push(photo.id)
          }
        } else {
          const errorText = await response.text()
          console.error(`OpenAI API error for photo ${photo.id}:`, response.status, errorText)
          errorCount++
          
          // If too many errors, stop processing
          if (errorCount >= 3) {
            console.error('Too many API errors, stopping process')
            break
          }
        }

        processedCount++
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`Error processing photo ${photo.id}:`, error)
        errorCount++
        
        // If too many errors, stop processing
        if (errorCount >= 3) {
          console.error('Too many processing errors, stopping')
          break
        }
      }
    }

    console.log(`Completed processing. Found ${matchingPhotos.length} matching photos. Processed: ${processedCount}, Errors: ${errorCount}`)

    // Check if we had too many errors
    if (errorCount >= 3 && processedCount === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Serviço de reconhecimento facial temporariamente indisponível. Tente novamente em alguns minutos.' 
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        matchingPhotos, 
        processedCount,
        totalPhotos: photosToCompare.length,
        errorCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Face recognition function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor. Tente novamente mais tarde.',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})