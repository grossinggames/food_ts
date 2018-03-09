'use strict';

/* *************** Отлавливаем необработанные исключения *************** */
process.on('uncaughtException', (err) => {
	console.log('Неотловленное исключение: ', err);
});

/* *************** Express *************** */
import express = require('express');
import { menuTitles } from './menu_titles';
let app = express();

/* *************** Express Middleware *************** */
let gaikan = require('gaikan');

/* *************** Express Routes *************** */
app.engine('html', gaikan);
app.set('view engine', '.html');
app.set('views', './views');
app.use(express.static('public'));

app.get('/:organization', async (req, res) => {
	// console.log('req.organization: ', req.params.organization);

	if ( req.params.organization.search('favicon') + 1 ) {
		return;
	}

	if (!req.params.organization) {
		return res.render('404');
	}

	function renderPage(files: string[]): void {
		let currentItem = req.query.item || (files[0] && files[0].split('\\')[3]) || ''; // Для Linux использовать '/' разделитель
		let menu:{ [key: string]: {
			active: boolean,
			title: string
		} } = {};
		let productImages:string[] = [];

		for (let i = 0, len = files.length; i < len; i++) {
			let key:string = files[i].split('\\')[3]; // Для Linux использовать '/' разделитель

			if (!menu[key]) {
				menu[key] = {
					active: currentItem == key? true : false,
					title: menuTitles[key] || key
				};
			}

			// Добавляем только нужные товары к примеру только [ пиццу, роллы или лапшу ]
			if (currentItem == key) {
				productImages.push( files[i].replace('public\\', '') );
			}
		}
		res.render('index', { menu: menu, productImages: productImages });
	}

	function renderPage404(err: Error) {
		console.log('renderPage404 Error: ', err);
		res.render('404');
	}

	try {
		let files:string[] = await getFiles(req.params.organization);
		renderPage(files);
	} catch(err) {
		renderPage404(err);
	}
});

const listener = app.listen(3000, () => {
	console.log('Start server port: ', listener.address().port, '!');
});

// ************************* Scandir *************************
function getFiles(organization:string = '', item:string = ''):Promise<string[]> {
	return new Promise((resolve) => {
		let scandir = require('scandir').create();
		let files:string[] = [];

		scandir.on('file', (file: string, stats: any) => {
			files.push(file);
		});

		scandir.on('error', (err: Error) => {
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