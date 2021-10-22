const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const app = express();
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const mv = require("mv");
const formidable = require("formidable");

const staticpath = path.join(__dirname, "public");
const port = process.env.PORT || 8800;
app.use(express.static(staticpath));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "pug");
app.set("views", "./views");

const connect1 = mongoose.createConnection(
	"mongodb+srv://mihirsinh:Mihir%402685@summerinternship.zijln.mongodb.net/Grocery?retryWrites=true&w=majority",
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
	}
);

const connect2 = mongoose.createConnection(
	"mongodb+srv://mihirsinh:Mihir%402685@summerinternship.zijln.mongodb.net/Product?retryWrites=true&w=majority",
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
	}
);

const userSchema = new mongoose.Schema({
	name: String,
	email: {
		type: String,
		unique: true,
	},
	address: String,
	city: String,
	pincode: Number,
	contact: Number,
	password: String,
});

const myOrderSchema = new mongoose.Schema({
	shopName: String,
	productName: [
		{
			id: { type: Number },
			name: { type: String },
			price: { type: Number },
			quantity: { type: Number },
			total: { type: Number },
		},
	],
	billAmount: Number,
	contactNumber: Number,
	date: String,
});

const orderSchema = new mongoose.Schema({
	customerName: String,
	productName: [
		{
			id: { type: Number },
			name: { type: String },
			price: { type: Number },
			quantity: { type: Number },
			total: { type: Number },
		},
	],
	billAmount: Number,
	contactNumber: Number,
	address: String,
	date: String,
});

const productSchema = new mongoose.Schema({
	name: String,
	img: String,
	price: Number,
});

const Customer = connect1.model("customer", userSchema);
const Shopkeeper = connect1.model("shopkeeper", userSchema);

const navbar = {
	addProduct: "Add Product",
	myorder: "My Order",
	order: "Order",
};

app.get("/", async (req, res) => {
	const isCustomer = req.cookies.isCustomer;
	const login = req.cookies.login;
	try {
		if (login) {
			const email = req.cookies.email.substring(0, req.cookies.email.indexOf("@"));
			const symbol = email.charAt(0).toUpperCase();
			if (isCustomer == "true") {
				const shop = await Shopkeeper.find({ pincode: req.cookies.pincode }, { name: 1, address: 1, email: 1 });
				if (shop.length > 0) {
					res.render("index", { signupHref: "Logout", navbar, login, isCustomer, shop, symbol });
				} else {
					let err = `There is no shop in your area right now. We are working on it to reach your area soon !!`;
					res.render("index", { signupHref: "Logout", navbar, login, isCustomer, err, symbol });
				}
			} else if (isCustomer == "false") {
				const Productdb = connect2.model(email, productSchema);
				const product = await Productdb.find({});
				if (product.length > 0) {
					res.render("index", { signupHref: "Logout", navbar, login, isCustomer, product, symbol });
				} else {
					let err = `There is no product in your shop right now. Try to add some product !!`;
					res.render("index", { signupHref: "Logout", navbar, login, isCustomer, err, symbol });
				}
			}
		} else {
			res.redirect("/login");
		}
	} catch (err) {
		console.log(err);
	}
});

app.get("/login", async (req, res) => {
	let isCustomer = req.cookies.isCustomer;
	let login = req.cookies.login;
	login ? res.redirect("/") : res.render("login", { signupHref: "Login/SignUp", navbar, login, isCustomer });
});

app.post("/login", async (req, res) => {
	try {
		const user = req.body.user.trim();
		const email = req.body.email.trim();
		const password = req.body.password.trim();
		let isCustomer;
		let result;
		if (user == "customer") {
			result = await Customer.findOne({ email });
			isCustomer = true;
		} else if (user == "shopkeeper") {
			result = await Shopkeeper.findOne({ email });
			isCustomer = false;
		}
		if (result) {
			const originalPass = result.password;
			if (password == originalPass) {
				res.cookie("login", true, { expire: 36000 + Date.now() });
				res.cookie("name", `${result.name}`, { expire: 36000 + Date.now() });
				res.cookie("pincode", `${result.pincode}`, { expire: 36000 + Date.now() });
				res.cookie("email", `${result.email}`, { expire: 36000 + Date.now() });
				res.cookie("isCustomer", `${isCustomer}`, { expire: 36000 + Date.now() });
				res.redirect("/");
			} else {
				throw new Error("Enter Valid Password !!");
			}
		} else {
			throw new Error("Enter Valid Email !!");
		}
	} catch (e) {
		res.render("login", { err: e.message, signupHref: "Login/SignUp", navbar });
	}
});

app.get("/SignUp", (req, res) => {
	res.render("Signup", { signupHref: "Login/SignUp", navbar });
});

app.post("/SignUp", async (req, res) => {
	try {
		const name = req.body.name.trim();
		const email = req.body.email.trim();
		const mobile = req.body.tel.trim();
		const pincode = req.body.pincode.trim();
		const address = req.body.add.trim();
		const city = req.body.city.trim();
		const user = req.body.user.trim();
		const password = req.body.password.trim();
		const cpassword = req.body.cpassword.trim();
		if (password != cpassword) {
			throw new Error("Enter Valid Credentials !!");
		}
		if (user == "Customer") {
			const result = await Customer.findOne({ email });
			if (result) {
				throw new Error("Email is already registered !!");
			} else {
				publicSch = { name, email, address, city, pincode, contact: mobile, password };
				const pub = new Customer(publicSch);
				const r = await pub.save();
				if (r) {
					res.render("Signup", { signupHref: "Login/SignUp", navbar });
				}
			}
		} else if (user == "shopkeeper") {
			const result = await Shopkeeper.findOne({ email });
			if (result) {
				throw new Error("Email is already registered !!");
			} else {
				publicSch = { name, email, address, city, pincode, contact: mobile, password };
				const pub = new Shopkeeper(publicSch);
				const r = await pub.save();
				if (r) {
					res.redirect("/login");
				}
			}
		}
	} catch (e) {
		res.render("Signup", { err: e.message, signupHref: "Login/SignUp", navbar });
	}
});

app.get("/fetchShop", async (req, res) => {
	try {
		const shop = await Shopkeeper.find({ pincode: req.cookies.pincode }, { name: 1, address: 1, email: 1 });
		if (shop.length > 0) {
			res.send(shop);
		} else {
			throw new Error(`There is no shop in your area right now. We are working on it to reach your area soon !!`);
		}
	} catch (err) {
		res.send({ error: err.message });
	}
});

app.get("/product", async (req, res) => {
	const login = req.cookies.login;
	const isCustomer = req.cookies.isCustomer;
	const symbol = req.cookies.email.charAt(0).toUpperCase();
	try {
		if (req.cookies.login) {
			let shop = req.query["id"];
			// + "s";
			let email = req.query["shop"];
			res.cookie("shopemail", email, { expire: 36000 + Date.now() });

			const ProductDb = connect2.model(shop, productSchema);
			const product = await ProductDb.find({});
			const productJson = JSON.stringify(product);

			if (product.length > 0) {
				res.render("product", { signupHref: "Logout", navbar, login, isCustomer, productJson, symbol });
			} else {
				throw new Error(`There is no products available. Please try after some time!!`);
			}
		} else {
			res.redirect("/login");
		}
	} catch (err) {
		res.render("product", { signupHref: "Logout", error: err.message, navbar, login, isCustomer, symbol });
	}
});

app.post("/product", async (req, res) => {
	try {
		const temp = req.body;
		const date = temp.pop().date;
		const product = temp;
		let amount = 0;
		const finalProduct = [];
		product.forEach((e) => {
			finalProduct.push({
				id: e.id,
				name: e.name,
				price: e.price,
				quantity: e.quantity,
				total: e.total,
			});
			amount += e.total;
		});

		//for customer
		const dbname = req.cookies.email.substring(0, req.cookies.email.indexOf("@"));
		const shopName = req.cookies.shopemail.substring(0, req.cookies.shopemail.indexOf("@"));
		const contactdetail = await Shopkeeper.findOne({ email: req.cookies.shopemail }, { _id: 0, contact: 1 });
		let shopcontact = contactdetail.contact;

		const custOrder = { shopName, productName: finalProduct, billAmount: amount, contactNumber: shopcontact, date };

		const OrderDb = connect1.model(dbname, myOrderSchema);
		const cuOr = new OrderDb(custOrder);
		const re = await cuOr.save();

		//for Shop
		const custName = req.cookies.name;
		const contactCust = await Customer.findOne({ email: req.cookies.email }, { _id: 0, contact: 1, address: 1 });

		let custAdd = contactCust.address;
		let custContact = contactCust.contact;

		const shopOrder = {
			customerName: custName,
			productName: finalProduct,
			billAmount: amount,
			contactNumber: custContact,
			address: custAdd,
			date,
		};

		const ShoporderDb = connect2.model(shopName + "order", orderSchema);
		const shOrder = new ShoporderDb(shopOrder);
		const r = await shOrder.save();

		if (r && re) {
			let transporter = nodemailer.createTransport({
				service: "gmail",
				auth: {
					user: "tpass3506@gmail.com", // username for your mail server
					pass: "mihir1322", // password
				},
			});
			transporter.sendMail(
				{
					from: "tpass3506@gmail.com", // sender address
					to: req.cookies.shopemail, // list of receivers seperated by comma
					subject: "Regarding order", // Subject line
					html:
						"<h2>Hello,</h2><p>We are happy to tell you that You receive an order form " +
						req.cookies.name +
						" please check order list. And complete the order as soon as posible</p>",
				},
				(error, info) => {
					if (error) {
						res.status(500).send("Internal Server Error !!");
					} else if (info.response.includes("OK")) {
						res.status(200).send("Order place Successfully! You will be redirect in some time.");
					}
				}
			);
		} else {
			res.status(500).send("Can't place Order due to technical error !!");
		}
	} catch (error) {
		// console.log(error.message.toString());
		res.status(500).send(error.message);
	}
});

app.get("/Order", async (req, res) => {
	let login = req.cookies.login;
	if (login) {
		let isCustomer = req.cookies.isCustomer;
		let symbol = req.cookies.email.charAt(0).toUpperCase();
		if (isCustomer == "true") {
			const collection = req.cookies.email.substring(0, req.cookies.email.indexOf("@"));
			const Custdb = connect1.model(collection, myOrderSchema);
			const order = await Custdb.find({});
			const orderJson = JSON.stringify(order);

			res.render("order", { signupHref: "Logout", navbar, login, isCustomer, orderJson, symbol });
		} else if (isCustomer == "false") {
			const collection = req.cookies.email.substring(0, req.cookies.email.indexOf("@"));
			const Shopdb = connect2.model(collection + "order", orderSchema);
			const order = await Shopdb.find({});

			const orderJson = JSON.stringify(order);
			res.render("order", { signupHref: "Logout", navbar, login, isCustomer, orderJson, symbol });
		}
	} else {
		res.redirect("/login");
	}
});

app.get("/addProduct", async (req, res) => {
	const login = req.cookies.login;
	const isCustomer = req.cookies.isCustomer;
	const symbol = req.cookies.email.charAt(0).toUpperCase();
	if (login == "true" && isCustomer == "false") {
		res.render("addproduct", { signupHref: "Logout", navbar, login, isCustomer, symbol });
	} else {
		res.send("You are not authorized to view this page !!!");
	}
});

app.post("/addProduct", async (req, res) => {
	const sEmail = req.cookies.email.split("@")[0];
	const symbol = req.cookies.email.charAt(0).toUpperCase();
	const login = req.cookies.login;
	const isCustomer = req.cookies.isCustomer;

	const form = new formidable.IncomingForm();
	form.parse(req, async (err, fields, files) => {
		var oldpath = files.photo.path;
		var newpath = path.join(__dirname, "public/image/upload/" + files.photo.name);
		mv(oldpath, newpath, function (err) {
			if (err) {
			} else {
				console.log("file uploaded......");
			}
		});
		Sch = { name: fields.name.trim(), img: files.photo.name.trim(), price: fields.price.trim() };

		const ProductDb = connect2.model(sEmail, productSchema);
		const pub = new ProductDb(Sch);
		const r = await pub.save();
		if (r) {
			res.redirect("/");
		} else {
			res.render("addproduct", { fail: "Product not added !!", signupHref: "Logout", navbar, login, isCustomer, symbol });
		}
	});
});

app.post("/sendmail", async (req, res) => {
	let email = req.body.email;
	let transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: "tpass3506@gmail.com", // username for your mail server
			pass: "Mihir@2114", // password
		},
	});
	let result = (await Customer.findOne({ email }, { _id: 0, password: 1 })) || (await Shopkeeper.findOne({ email }, { _id: 0, password: 1 }));
	if (result) {
		// send mail with defined transport object
		transporter.sendMail(
			{
				from: "tpass3506@gmail.com", // sender address
				to: email, // list of receivers seperated by comma
				subject: "Changing Password", // Subject line
				text: "Your Password is :- " + result.password,
			},
			(error, info) => {
				if (error) {
					res.send(error.response);
				} else if (info.response.includes("OK")) {
					res.send("Email sent successfully !");
				}
			}
		);
	} else {
		res.send("Your are not register in our database, Please SignUp!");
	}
});

app.get("/logout", (req, res) => {
	res.clearCookie("login");
	res.clearCookie("name");
	res.clearCookie("pincode");
	res.clearCookie("email");
	res.clearCookie("isCustomer");
	res.clearCookie("shopemail");
	res.redirect("/login");
});

app.on("error", (err) => console.log(err));

app.listen(port, (err) => {
	console.log(`running on port ${port}`);
	if (err) console.log(err);
});
