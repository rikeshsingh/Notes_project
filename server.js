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
  let reqPath = req.url.split('?')[0]
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
