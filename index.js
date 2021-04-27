const Discord = require('discord.js');
const ytdl = require('ytdl-core')
const client = new Discord.Client();
const google = require('googleapis')
const config = require('./config.json')
const prefixo = config.PREFIXO

const youtube = new google.youtube_v3.Youtube({
  version: 'v3',
  auth: config.GOOGLE
})

const servidores = {
  'server':{
    connection: null,
    dispatcher: null,
    fila: [],
    tocando: false
  }
}

//Se o bot estiver pronto, manda uma mensagem
client.on("ready", () =>{
  console.log('Tuturu!');
});

//se a mensagem for um comando, realiza uma função
client.on("message", async (msg) =>{

  //filtros
  if (!msg.guild) return;
  if (!msg.content.startsWith(prefixo)) return;
  
  //comandos

  //play youtube

  if (msg.content.startsWith(prefixo + 'play')){
    let msc = msg.content.slice(6)
    
    if(msc.length === 0){
        msg.channel.send('Hmm, acho que voce esqueceu de colocar algo pra mim tocar :( ')
        return
    }

    if (!msg.member.voice.channel){
    msg.channel.send('A Mayushii só consegue executar esse comando se vc estiver no canal de voz!')
    return
  }
    servidores.server.connection = await msg.member.voice.channel.join();
    if(ytdl.validateURL(msc)){
        servidores.server.fila.push(msc)
        console.log('adicionado: ' + msc)
      
    }
    else{
        youtube.search.list({
            q: msc,
            part: 'snippet',
            fields: 'items(id(videoId), snippet(title))',
            type: 'video'
          }, function(err, resultado){
            if(err){
              console.log(err)
            }
            if(resultado){
              const id = resultado.data.items[0].id.videoId
              msc = 'https://www.youtube.com/watch?v=' + id
              servidores.server.fila.push(msc)
              console.log('adicionado: ' + msc)
            }
          
          })
    }
    tmsc()
  }
  
  
  //pausa a musica
  if (msg.content === prefixo + 'pause'){
    servidores.server.dispatcher.pause()
     msg.channel.send('Musica pausada :) ')
  }
  //resume a musica
  if (msg.content === prefixo + 'resume'){
    servidores.server.dispatcher.resume()
    msg.channel.send('Musica resumida :) ')
  }
  //sai do canal de voz
  if (msg.content === prefixo + 'leave'){
    msg.member.voice.channel.leave()
    servidores.server.connection = null
    servidores.server.dispatcher = null
    msg.channel.send('Até mais Tarde, Tuturu~ ')
  }
  //responde a um chamado de oi
  if (msg.content === prefixo + 'oi'){
    msg.channel.send('Oi ' + msg.author.username + ', Tuturu~'); 
  }

});

const tmsc = () => {
if(servidores.server.tocando === false){
    const prox = servidores.server.fila[0]
    servidores.server.tocando = true
    servidores.server.dispatcher = servidores.server.connection.play(ytdl(prox, config.YTDL))

    servidores.server.dispatcher.on('finish', () => {

        servidores.server.fila.shift()
        servidores.server.tocando = false
        if(servidores.server.fila.length > 0){
            tmsc()

        }
        else{
            servidores.server.dispatcher = null
        }
    })
}    
}

client.login(config.TOKEN);