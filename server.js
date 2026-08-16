const http = require('http')
const fs = require('fs')
const path = require('path')

const port = process.env.PORT || 9000
const root = path.join(__dirname)

const mime = {
  '.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.json':'application/json',
  '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.ico':'image/x-icon'
}

const server = http.createServer((req,res)=>{
  const parsedUrl = req.url.split('?')[0]

  // Simple JSON persistence API for notes
  if(parsedUrl === '/api/notes'){
    if(req.method === 'GET'){
      const dataPath = path.join(root, 'data.json')
      fs.readFile(dataPath, 'utf8', (err, content)=>{
        if(err){
          res.statusCode = 500
          res.setHeader('Content-Type','application/json')
          res.end(JSON.stringify({error: 'Failed reading data'}))
          return
        }
        res.setHeader('Content-Type','application/json')
        res.end(content)
      })
      return
    }

    if(req.method === 'POST'){
      let body = ''
      req.on('data', chunk=> body += chunk)
      req.on('end', ()=>{
        try{
          // validate JSON
          JSON.parse(body)
          const dataPath = path.join(root, 'data.json')
          fs.writeFile(dataPath, body, 'utf8', err=>{
            if(err){
              res.statusCode = 500
              res.setHeader('Content-Type','application/json')
              res.end(JSON.stringify({error:'Failed writing data'}))
              return
            }
            res.setHeader('Content-Type','application/json')
            res.end(JSON.stringify({ok:true}))
          })
        }catch(e){
          res.statusCode = 400
          res.setHeader('Content-Type','application/json')
          res.end(JSON.stringify({error:'Invalid JSON'}))
        }
      })
      return
    }

    res.statusCode = 405
    res.end('Method not allowed')
    return
  }

  let reqPath = parsedUrl
  if(reqPath === '/') reqPath = '/index.html'
  const filePath = path.join(root, reqPath)
  fs.stat(filePath, (err, stat)=>{
    if(err || !stat.isFile()){
      res.statusCode = 404
      res.end('Not found')
      return
    }
    const ext = path.extname(filePath)
    res.setHeader('Content-Type', mime[ext] || 'application/octet-stream')
    const stream = fs.createReadStream(filePath)
    stream.pipe(res)
  })
})

server.listen(port, ()=> console.log(`Static server running at http://localhost:${port}`))
