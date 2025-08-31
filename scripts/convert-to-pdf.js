const puppeteer = require('puppeteer');
const MarkdownIt = require('markdown-it');
const fs = require('fs');
const path = require('path');

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

// CSS pour le styling du PDF
const cssStyles = `
<style>
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
  }
  
  h1 {
    color: #2c5aa0;
    border-bottom: 3px solid #2c5aa0;
    padding-bottom: 10px;
    font-size: 2.2em;
    margin-top: 0;
  }
  
  h2 {
    color: #2c5aa0;
    border-bottom: 1px solid #ddd;
    padding-bottom: 5px;
    margin-top: 30px;
    font-size: 1.5em;
  }
  
  h3 {
    color: #444;
    margin-top: 25px;
    font-size: 1.2em;
  }
  
  h4 {
    color: #666;
    margin-top: 20px;
  }
  
  p {
    margin-bottom: 15px;
    text-align: justify;
  }
  
  ul, ol {
    margin-bottom: 15px;
    padding-left: 30px;
  }
  
  li {
    margin-bottom: 5px;
  }
  
  code {
    background-color: #f4f4f4;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
  }
  
  pre {
    background-color: #f8f8f8;
    border: 1px solid #ddd;
    border-radius: 5px;
    padding: 15px;
    overflow-x: auto;
    margin-bottom: 20px;
  }
  
  blockquote {
    border-left: 4px solid #2c5aa0;
    margin: 20px 0;
    padding-left: 20px;
    font-style: italic;
    color: #666;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 0.9em;
  }
  
  th, td {
    border: 1px solid #ddd;
    padding: 8px 12px;
    text-align: left;
  }
  
  th {
    background-color: #f2f2f2;
    font-weight: bold;
    color: #2c5aa0;
  }
  
  tr:nth-child(even) {
    background-color: #f9f9f9;
  }
  
  .header {
    text-align: center;
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 2px solid #2c5aa0;
  }
  
  .footer {
    margin-top: 50px;
    padding-top: 20px;
    border-top: 1px solid #ddd;
    text-align: center;
    font-size: 0.9em;
    color: #666;
  }
  
  .toc {
    background-color: #f8f9fa;
    border: 1px solid #ddd;
    border-radius: 5px;
    padding: 20px;
    margin-bottom: 30px;
  }
  
  .toc h2 {
    margin-top: 0;
    color: #2c5aa0;
    border: none;
  }
  
  .toc ul {
    margin: 0;
    padding-left: 20px;
  }
  
  .toc a {
    text-decoration: none;
    color: #2c5aa0;
  }
  
  .toc a:hover {
    text-decoration: underline;
  }
  
  .status-passed { color: #28a745; }
  .status-failed { color: #dc3545; }
  .status-warning { color: #ffc107; }
  .status-pending { color: #6c757d; }
  .status-blocked { color: #6f42c1; }
  
  @media print {
    body { margin: 0; }
    .page-break { page-break-before: always; }
  }
</style>
`;

async function convertMarkdownToPDF(markdownFile, outputFile, title) {
  try {
    console.log(`Converting ${markdownFile} to PDF...`);
    
    // Lire le fichier Markdown
    const markdownContent = fs.readFileSync(markdownFile, 'utf8');
    
    // Convertir en HTML
    const htmlContent = md.render(markdownContent);
    
    // Créer le HTML complet
    const fullHtml = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      ${cssStyles}
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p><strong>Système de Gestion de Centre d'Appels Konecta</strong></p>
        <p>Version 1.0 - ${new Date().toLocaleDateString('fr-FR')}</p>
      </div>
      
      ${htmlContent}
      
      <div class="footer">
        <p><strong>Konecta - Centre d'Appels</strong></p>
        <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
      </div>
    </body>
    </html>
    `;
    
    // Lancer Puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Charger le HTML
    await page.setContent(fullHtml, {
      waitUntil: 'networkidle0'
    });
    
    // Générer le PDF
    await page.pdf({
      path: outputFile,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; color: #666; width: 100%; text-align: center; margin-top: 10px;">
          <span>Konecta - ${title}</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; color: #666; width: 100%; text-align: center; margin-bottom: 10px;">
          <span>Page <span class="pageNumber"></span> sur <span class="totalPages"></span></span>
        </div>
      `
    });
    
    await browser.close();
    
    console.log(`✅ PDF généré avec succès: ${outputFile}`);
    
  } catch (error) {
    console.error(`❌ Erreur lors de la conversion: ${error.message}`);
    throw error;
  }
}

async function main() {
  try {
    const projectRoot = path.resolve(__dirname, '..');
    
    // Convertir le Manuel Utilisateur
    await convertMarkdownToPDF(
      path.join(projectRoot, 'Manuel_Utilisateur_Konecta.md'),
      path.join(projectRoot, 'Manuel_Utilisateur_Konecta.pdf'),
      'Manuel Utilisateur'
    );
    
    // Convertir le Cahier de Tests
    await convertMarkdownToPDF(
      path.join(projectRoot, 'Cahier_de_Tests_Konecta.md'),
      path.join(projectRoot, 'Cahier_de_Tests_Konecta.pdf'),
      'Cahier de Tests'
    );
    
    console.log('\n🎉 Tous les PDFs ont été générés avec succès !');
    console.log('📁 Fichiers créés:');
    console.log('   - Manuel_Utilisateur_Konecta.pdf');
    console.log('   - Cahier_de_Tests_Konecta.pdf');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
main();
