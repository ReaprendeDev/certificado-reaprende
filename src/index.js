const http = require('http');
const fs = require('fs');
const pdfmake = require('pdfmake');

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/src/index') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const jsonData = JSON.parse(body);
        generatePdf(jsonData, (pdfBuffer) => {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename=generated.pdf'); // Cambiar 'inline' a 'attachment'
          res.end(pdfBuffer);
        });
      } catch (error) {
        res.statusCode = 400;
        res.end('Error en los datos JSON.');
      }
    });
  } else {
    res.statusCode = 404;
    res.end('Ruta no encontrada.');
  }
});

server.listen(3000, () => {
  console.log('Servidor en ejecución en el puerto 3000');
});

function generatePdf(data, callback) {
  const backgroundImagePath = './src/background_image.txt'; // Ruta al archivo de imagen de fondo en base64
  const backgroundImageData = fs.readFileSync(backgroundImagePath, 'utf-8');

  const fonts = {
    Roboto: {
      normal: './node_modules/roboto-font/fonts/Roboto/roboto-regular-webfont.ttf',
      bold: './node_modules/roboto-font/fonts/Roboto/roboto-bold-webfont.ttf',
    },
  };

  const pdfMake = new pdfmake(fonts);

  const pdfDefinition = {
    pageOrientation: 'landscape',
    pageSize: 'A4',
    pageMargins: [0, 0, 0, 0], // Sin márgenes
    content: [
      {
        image: backgroundImageData,
        width: 842, // Ancho de A4 en modo paisaje
        height: 595, // Alto de A4 en modo paisaje
        absolutePosition: { x: 0, y: 0 }, // Colocar la imagen en la parte superior izquierda
      },
      {
        text: `${data.nombre}`,
        fontSize: 32,
        alignment: 'center',
        absolutePosition: { x: 0, y: 250 }, // Ajusta la posición del texto encima de la imagen
      },
      // Puedes agregar más contenido aquí según tus necesidades
    ],
  };

  const pdfDoc = pdfMake.createPdfKitDocument(pdfDefinition);

  const chunks = [];
  pdfDoc.on('data', (chunk) => {
    chunks.push(chunk);
  });

  pdfDoc.on('end', () => {
    const pdfBuffer = Buffer.concat(chunks);
    callback(pdfBuffer);
  });

  pdfDoc.end();
}
