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
const fs = require("fs");
const menu_titles_1 = require("./menu_titles");
let app = express();
/* *************** Express Middleware *************** */
let gaikan = require('gaikan');
/* *************** Express Routes *************** */
app.engine('html', gaikan);
app.set('view engine', '.html');
app.set('views', './views');
app.use(express.static('public'));
;
app.get('/:organization', (req, res) => __awaiter(this, void 0, void 0, function* () {
    // console.log('req.organization: ', req.params.organization);
    if (req.params.organization.search('favicon') + 1) {
        return;
    }
    if (!req.params.organization) {
        return res.render('404');
    }
    function renderPage(files, description) {
        let currentItem = req.query.item || (files[0] && files[0].split('\\')[3]) || ''; // Для Linux использовать '/' разделитель
        let menu = {};
        let productImages = [];
        for (let i = 0, len = files.length; i < len; i++) {
            let menuItem = files[i].split('\\')[3]; // Для Linux использовать '/' разделитель
            if (!menu[menuItem]) {
                menu[menuItem] = {
                    active: currentItem == menuItem ? true : false,
                    title: menu_titles_1.menuTitles[menuItem] || menuItem
                };
            }
            // Добавляем только нужные товары к примеру только [ пиццу, роллы или лапшу ]
            if (currentItem == menuItem) {
                let nameImage = files[i].split('\\')[4];
                // console.log('nameImage ', nameImage);
                // console.log('menuItem ', menuItem);
                // console.log('description ', description);
                // console.log('description[menuItem] ', description[menuItem]);
                // console.log('description[menuItem][nameImage] ', description[menuItem][nameImage]);
                if (nameImage && description &&
                    description[menuItem] && description[menuItem][nameImage]) {
                    description[menuItem][nameImage];
                    description[menuItem][nameImage].pathImage = files[i].replace('public\\', '');
                    productImages.push(description[menuItem][nameImage]);
                }
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
        let path = './public/organizations/' + req.params.organization + '/description.json';
        let description = yield new Promise((resolve, reject) => {
            fs.readFile(path, 'utf8', function (err, data) {
                if (err)
                    return reject(err);
                resolve(JSON.parse(data));
            });
        });
        if (files && description) {
            renderPage(files, description);
        }
        else {
            throw 'Not found menu';
        }
    }
    catch (err) {
        console.log(err);
        renderPage404(err);
    }
}));
const listener = app.listen(3000, () => {
    console.log('Start server port: ', listener.address().port, '!');
});
// ************************* Scandir *************************
function getFiles(organization = '', item = '') {
    return new Promise((resolve, reject) => {
        let scandir = require('scandir').create();
        let files = [];
        scandir.on('file', (file, stats) => {
            files.push(file);
        });
        scandir.on('error', (err) => {
            reject(err);
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
