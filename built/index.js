'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/* *************** Отлавливаем необработанные исключения *************** */
process.on('uncaughtException', (err) => {
    console.log('Неотловленное исключение: ', err);
});
/* *************** Express *************** */
const express = require("express");
const menu_titles_1 = require("./menu_titles");
let app = express();
/* *************** Express Middleware *************** */
let gaikan = require('gaikan');
/* *************** Express Routes *************** */
app.engine('html', gaikan);
app.set('view engine', '.html');
app.set('views', './views');
app.use(express.static('public'));
app.get('/:organization', (req, res) => __awaiter(this, void 0, void 0, function* () {
    // console.log('req.organization: ', req.params.organization);
    if (req.params.organization.search('favicon') + 1) {
        return;
    }
    if (!req.params.organization) {
        return res.render('404');
    }
    function renderPage(files) {
        let currentItem = req.query.item || (files[0] && files[0].split('\\')[3]) || ''; // Для Linux использовать '/' разделитель
        let menu = {};
        let productImages = [];
        for (let i = 0, len = files.length; i < len; i++) {
            let key = files[i].split('\\')[3]; // Для Linux использовать '/' разделитель
            if (!menu[key]) {
                menu[key] = {
                    active: currentItem == key ? true : false,
                    title: menu_titles_1.menuTitles[key] || key
                };
            }
            // Добавляем только нужные товары к примеру только [ пиццу, роллы или лапшу ]
            if (currentItem == key) {
                productImages.push(files[i].replace('public\\', ''));
            }
        }
        res.render('index', { menu: menu, productImages: productImages });
    }
    function renderPage404(err) {
        console.log('renderPage404 Error: ', err);
        res.render('404');
    }
    try {
        let files = yield getFiles(req.params.organization);
        renderPage(files);
    }
    catch (err) {
        renderPage404(err);
    }
}));
const listener = app.listen(3000, () => {
    console.log('Start server port: ', listener.address().port, '!');
});
// ************************* Scandir *************************
function getFiles(organization = '', item = '') {
    return new Promise((resolve) => {
        let scandir = require('scandir').create();
        let files = [];
        scandir.on('file', (file, stats) => {
            files.push(file);
        });
        scandir.on('error', (err) => {
            throw err;
        });
        scandir.on('end', () => {
            resolve(files);
        });
        scandir.scan({
            dir: './public/organizations/' + organization + '/' + item,
            recursive: true,
            filter: /.png|.jpg|.jpeg/i
        });
    });
}
