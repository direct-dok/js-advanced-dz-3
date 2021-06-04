const API = 'https://raw.githubusercontent.com/GeekBrainsTutorial/online-store-api/master/responses';

class ProductsList {
    constructor(container, cartObject) {
        this.cartObject = cartObject;
        this.container = container;
        this.goods = [];//массив товаров
        this.allProducts = [];//массив объектов
        this._getProducts()
            .then(data => { //data - объект js
                this.goods = [...data];
                this.render()
            });
    }

    _getProducts() {
        return fetch(`${API}/catalogData.json`)
            .then(result => result.json())
            .catch(error => {
                console.log(error);
            })
    }
    calcSum() {
        return this.allProducts.reduce((accum, item) => accum += item.price, 0);
    }
    render() {
        const block = document.querySelector(this.container);
        for (let product of this.goods) {
            const productObj = new ProductItem(product);
            this.allProducts.push(productObj);
            block.insertAdjacentHTML('beforeend', productObj.render());
        }
        this.cartObject.showCart();
        this.addEventBuyButton();
    }

    addEventBuyButton() {
        let allBuyButton = document.querySelectorAll('.buy-btn');

        allBuyButton.forEach((el) => {
            el.addEventListener('click', (e) => {
                if(this.cartObject.checkAvailability(e.target.dataset.id)) {
                    this.cartObject.plusCountProductCart(e.target.dataset.id);
                } else {
                    let itemNumberArray = Cart.getNumberElementArray(this.goods, e.target.dataset.id);
                    let objAddCart = this.goods[itemNumberArray]
                    objAddCart.quantity = 1;
                    this.cartObject.addBasketProduct(objAddCart);
                }
            });
        });
    }
}


class ProductItem {
    constructor(product, img = 'img/plug.jpg') {
        this.title = product.product_name;
        this.price = product.price;
        this.id = product.id_product;
        this.img = img;
    }
    render() {
        return `<div class="product-item" data-id="${this.id}">
                <img src="${this.img}" alt="Some img">
                <div class="desc">
                    <h3>${this.title}</h3>
                    <p>${this.price} $</p>
                    <button class="buy-btn" data-id="${this.id}">Купить</button>
                </div>
            </div>`
    }
}



class Cart {

    constructor(openButtonSelector, cartBlockSelector, wrapperCartSelector) {
        this.wrapperCartSelector = document.querySelector(wrapperCartSelector); // Элемент обертка корзины
        this.openButtonSelector = document.querySelector(openButtonSelector); // Кнопка корзины
        this.cartBlockSelector = document.querySelector(cartBlockSelector); // Блок элементов корзины
        this.storageProdutsCart = '';
        this.storageHtmlProductCart = '';
        this.getProductCart();

    }

    // initCart() {
    //     this.showCart();
    // }

    showCart() {
        this.openButtonSelector.addEventListener('click', () => {
            this.wrapperCartSelector.classList.toggle('show');
        })
    }

    getProductCart() {
        return fetch(`${API}/getBasket.json`)
            .then(result => result.json())
            .then(result => this.editStorageProdutsCart(result))
            .catch(error => console.log(error));
    }

    editStorageProdutsCart(res) {
        if (res.contents.length) {
            this.storageProdutsCart = res;
            // console.log(this.storageProdutsCart.contents);
            this.storageProdutsCart.contents.forEach((el, index) => {
                // console.log(el);

                let elem = new CartProductItem(el);
                this.storageHtmlProductCart += elem.createItemCart();
                // console.log(this.storageHtmlProductCart);

            });

            this.renderHtmlProductCart(this.storageHtmlProductCart);
            this.wrapperCartSelector.querySelector('.cart__total-price').innerHTML = this.calculationPurchaseAmount(this.storageProdutsCart.contents) + '<span>руб.</span>';

        } else {
            this.wrapperCartSelector.querySelector('.cart__total-price').innerHTML = this.calculationPurchaseAmount(this.storageProdutsCart.contents) + '<span>руб.</span>';
            this.cartBlockSelector.innerHTML = '<p>Корзина пуста</p>'
        }
        
    }

    addBasketProduct(objectProduct) { // Метод добавляющий товар в корзину, если конечно товара там нет
        
        this.storageProdutsCart.contents.push(objectProduct);
        this.storageHtmlProductCart = '';
        this.editStorageProdutsCart(this.storageProdutsCart);
    }

    plusCountProductCart(idProduct) { // Метод увеличивающий количество товара в корзине, в случае, если товар в корзине есть
        let elem = Cart.getNumberElementArray(this.storageProdutsCart.contents, idProduct);
        this.storageProdutsCart.contents[elem].quantity++;
        this.storageHtmlProductCart = '';
        this.editStorageProdutsCart(this.storageProdutsCart);
    }

    calculationPurchaseAmount(products) { // Считаем общую сумму покупки
        let totalPrice = 0;
        products.forEach(el => {
            totalPrice += el.price * el.quantity;
        })

        return totalPrice;
    }

    renderHtmlProductCart(elems) { // Рендерим товары в корзине
        this.cartBlockSelector.innerHTML = elems;
        this.eventDeleteButton();
        this.quantityControl();
    }

    eventDeleteButton() { // Получаем кнопку удалить и вешаем на нее событие клика
        let allDeleteButton = this.cartBlockSelector.querySelectorAll('.cart__delete-cart-product');
        allDeleteButton.forEach(button => {
            button.addEventListener('click', (e) => {
                this.storageProdutsCart.contents.forEach((el, index) => {
                    if (e.target.dataset.idproduct == el.id_product) {
                        this.storageProdutsCart.contents.splice(index, 1);
                        this.storageHtmlProductCart = '';
                        this.editStorageProdutsCart(this.storageProdutsCart);
                    }
                })
            })
        })
    }

    quantityControl() { // Управление элементами количества единицы товара
        let plus = this.cartBlockSelector.querySelectorAll('.cart__control-quantity--plus');
        let minus = this.cartBlockSelector.querySelectorAll('.cart__control-quantity--minus');

        plus.forEach(elem => {
            elem.addEventListener('click', (e) => {
                let positionArrProduct = Cart.getNumberElementArray(this.storageProdutsCart.contents, e.target.dataset.idproduct);
                this.storageProdutsCart.contents[positionArrProduct].quantity++;
                this.storageHtmlProductCart = '';
                this.editStorageProdutsCart(this.storageProdutsCart);
            })
        });

        minus.forEach(elem => {
            elem.addEventListener('click', (e) => {
                let positionArrProduct = Cart.getNumberElementArray(this.storageProdutsCart.contents, e.target.dataset.idproduct);
                if(this.storageProdutsCart.contents[positionArrProduct].quantity > 1) {
                    this.storageProdutsCart.contents[positionArrProduct].quantity--;
                    this.storageHtmlProductCart = '';
                    this.editStorageProdutsCart(this.storageProdutsCart);
                } else {
                    this.storageHtmlProductCart = '';
                    this.editStorageProdutsCart(this.storageProdutsCart);
                    
                }
            })
        })
    }

    static getNumberElementArray(arr, idProduct) { // Ищем индекс массива с товаром и возвращаем его
        let position = 0;
        arr.forEach((el, index) => {
            if(el.id_product == idProduct) {
                position = index;
            }
        });

        return position;
    }
    

    checkAvailability(idProduct) { // Метод проверяющий есть ли товар в массиве товаров "this.storageProdutsCart.contents"
        let success = false;
        this.storageProdutsCart.contents.forEach(el => {
            (el.id_product == idProduct) ? success = true : false;
        });

        return success;
    }

}

class CartProductItem {

    constructor(arrElem) {
        this.idProduct = arrElem.id_product;
        this.price = arrElem.price;
        this.productName = arrElem.product_name;
        this.quantity = arrElem.quantity;
    }

    createItemCart() {
        return `
        <div class="cart__item" data-id-product="${this.idProduct}">
            <div class="cart__item-wrapper-img">
                <img src="img/plug.jpg" alt="Заглушка" class="cart__item-img">
            </div>
            <div class="cart__item-name">${this.price}</div>
            <div class="cart__item-price">
                <div class="cart__label-price">Цена (руб.)</div>
                <div class="cart__product-price">${this.productName}</div>
            </div>
            <div class="cart__item-quantity">
                <div class="cart__control-quantity cart__control-quantity--minus" data-idproduct="${this.idProduct}">-</div>
                <div class="cart__total-quantity">${this.quantity}</div>
                <div class="cart__control-quantity cart__control-quantity--plus" data-idproduct="${this.idProduct}">+</div>
            </div>
            <button class="cart__delete-cart-product" data-idproduct="${this.idProduct}">Удалить</button>
        </div>
        `
    }

}

let cart = new Cart('.btn-cart', '.cart__items-cart', '.cart');
let list = new ProductsList('.products', cart);

