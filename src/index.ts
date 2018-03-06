'use strict';

/* *************** Отлавливаем необработанные исключения *************** */
process.on('uncaughtException', (err) => {
	console.log('Неотловленное исключение: ', err);
});

/* *************** Express *************** */
import express = require('express');
let app = express();

/* *************** Express Middleware *************** */
let gaikan = require('gaikan');

/* *************** Menu *************** */
let menuNames: { [key: string]: string } = {
	'rolls': 'Роллы',
	'sushi': 'Суши',
	'pizza': 'Пицца',
	'noodles': 'Лапша',
	'desserts': 'Десерты',
	'salads': 'Салаты',
	'soups': 'Супы',
	'shashlik': 'Шашлык',
	'vtoroe': 'Вторые блюда',
	'garnir': 'Гарнир',
	'deserti': 'Десерты',
	'napitki': 'Напитки'
};

/* *************** Express Routes *************** */
app.engine('html', gaikan);
app.set('view engine', '.html');
app.set('views', './views');
app.use(express.static('public'));

app.get('/:organization', async (req, res) => {
	// console.log('req.organization: ', req.params.organization);

	if (req.params.organization == 'favicon.ico') {
		// return console.log('stop.favicon');
		return;
	}

	if (!req.params.organization) {
		return res.render('404');
	}

	function renderPage(files: string[]): void {
		// console.log('Resolve files: ', files);
		// if (!files.length) throw new Error('Count find files == 0'); 

		let item = req.query.item || (files[0] && files[0].split('\\')[3]) || ''; // Для Linux использовать '/' разделитель
		let menu: { [key: string]: string } = {};

		let menuView = '';
		let contentView = '';

		//console.log(files);

		for (let i = 0, len = files.length; i < len; i++) {
			//console.log(files[i].split('/')[0]);
			let key:string = files[i].split('\\')[3]; // Для Linux использовать '/' разделитель
			//console.log(key);

			if (!menu[key]) {
				menu[key] = '1';
				if (item == key) {
					menuView += "<li class='active' style='background-color: #bbdefb'>";
				} else {
					menuView += "<li>";
				}
				menuView += "<a href='?item=" + key + "' class='menu-item'>" + (menuNames[key] || key) + "</a></li>";

			}

			// Берем только нужный пункт к примеру [ пицца, роллы, суши ]
			if (item == key) {
				let nameImg = files[i].split('\\')[4];
				let cardGroup = i;
				contentView += "<div class='food'><div class='col s12 m6'><div class='card'><div class='card-image'><img class='food-img' src='" + files[i].replace('public\\', '') + "'><span class='card-title' style='color: #2196f3'>" + /* menuNames[key] */ ' <br>' + /*nameImg +*/ "</span><a class='btn-floating btn-large halfway-fab waves-effect waves-light red'><i class='material-icons add-food'>add</i></a></div><div class='card-content description'><p>Состав: Лосось, сыр фетакса, огурец, авакадо</p></div></div></div></div>";
			}
		}
		//console.log(menuView);
		//console.log(contentView);
		res.render('index', { menuView: menuView, item: item, contentView: contentView });
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