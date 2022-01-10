import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let product: Product = {} as Product;
      const updateCard = [...cart];
      const productExist = updateCard.find(product => { return product.id === productId});
      const stock = await api.get('stock/' + productId.toString());
      const stockAmount = stock.data.amount;
      const currentAmount = productExist ? productExist.amount : 0;
      const amount = currentAmount + 1;
      
      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if(!stockAmount) {
        throw Error();
      }

      if(productExist) {
        productExist.amount = amount;
      } else {
        await api.get('/products/' + productId.toString()).then((res) => {product = res.data })
        product.amount = 1;
        updateCard.push(product);
      }

      setCart(updateCard);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCard));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];
      const newCartSplice = newCart.filter( product => { return product.id !== productId});
      if(newCartSplice.length === newCart.length){
        throw Error();
      }
      setCart(newCartSplice);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCartSplice));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock = await api.get('stock/' + productId.toString());
      const stockAmount = stock.data.amount;

      if(amount <= 0){
        toast.error("Erro na adição do produto");
        return
      }

      const cartAltered = [...cart];
      const productExist = cartAltered.find((product) => product.id == productId);
      const amounte = amount;

      if(amounte > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if(productExist){
        productExist.amount = amounte;
        setCart(cartAltered);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      } else {
        throw Error();
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
