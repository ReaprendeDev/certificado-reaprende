const http = require('http');
const fs = require('fs');
const pdfmake = require('pdfmake');
const { v4: uuidv4 } = require('uuid');

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
          const fileName = `generated_${uuidv4()}.pdf`;
          const filePath = `./temp/${fileName}`;

          fs.writeFileSync(filePath, pdfBuffer);

          const downloadLink = `/download/${fileName}`;
          const jsonResponse = { downloadLink };

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(jsonResponse));
        });
      } catch (error) {
        res.statusCode = 400;
        res.end('Error en los datos JSON.');
      }
    });
  } else if (req.method === 'GET' && req.url.startsWith('/download/')) {
    const fileName = req.url.split('/').pop();
    const filePath = `./temp/${fileName}`;

    fs.access(filePath, fs.constants.R_OK, (err) => {
      if (!err) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.statusCode = 404;
        res.end('Archivo no encontrado.');
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
  const curso = data.curso || 1; // Valor predeterminado: 1
  const backgroundImagePath = `./src/background_image${curso}.txt`;

  try {
    const backgroundImageData = fs.readFileSync(backgroundImagePath, 'utf-8');

    const fonts = {
      Roboto: {
        normal: './node_modules/roboto-font/fonts/Roboto/roboto-regular-webfont.ttf',
        bold: './node_modules/roboto-font/fonts/Roboto/roboto-bold-webfont.ttf',
      },
    };

    const pdfMake = new pdfmake(fonts);

    const date = new Date();
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const formattedDate = `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;

    let pdfDefinition;

    if (curso === 11) {
      pdfDefinition = {
        pageOrientation: 'landscape',
        pageSize: 'A4',
        pageMargins: [0, 0, 0, 0],
        content: [
          {
            image: backgroundImageData,
            width: 842,
            height: 595,
            absolutePosition: { x: 0, y: 0 },
          },
          {
            text: `${data.nombre}`,
            fontSize: 32,
            alignment: 'center',
            absolutePosition: { x: 0, y: 270 },
          },
          {
            text: formattedDate, // Agregar la fecha
            fontSize: 16,
            alignment: 'center',
            absolutePosition: { x: 260, y: 395 }, // Posición debajo del nombre
          },
        ],
      };
    } else {
      pdfDefinition = {
        pageOrientation: 'landscape',
        pageSize: 'A4',
        pageMargins: [0, 0, 0, 0],
        content: [
          {
            image: backgroundImageData,
            width: 842,
            height: 595,
            absolutePosition: { x: 0, y: 0 },
          },
          {
            text: `${data.nombre}`,
            fontSize: 32,
            alignment: 'center',
            absolutePosition: { x: 160, y: 220 },
          },
          {
            text: formattedDate, // Agregar la fecha
            fontSize: 16,
            alignment: 'center',
            color: '#00953B', // Color de la letra: verde
            absolutePosition: { x: 379, y: 384 }, // Posición debajo del nombre
          },
        ],
      };
    }

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
  } catch (error) {
    console.error('Error al leer el archivo de fondo:', error);
    throw error;
  }
}
