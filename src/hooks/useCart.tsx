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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  async function setLocalStorage(newValue: Product[]) {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(newValue));
  }



  const addProduct = async (productId: number) => {
    try {

      const existProduct = cart.find(product => product.id === productId)
      
      if (existProduct) {
        updateProductAmount({
          amount:existProduct.amount+1,
          productId
        })
        return;
      }

      const productAPI = (await api.get<Product>(`/products/${productId}`)).data;
      
      setCart([...cart, {
        id: productAPI.id,
        amount: 1,
        image: productAPI.image,
        price: productAPI.price,
        title: productAPI.title,
      }])

      setLocalStorage([...cart, {
        id: productAPI.id,
        amount: 1,
        image: productAPI.image,
        price: productAPI.price,
        title: productAPI.title,
      }])

      return;

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if (!cart.find(product => product.id === productId)) {
        toast.error('Erro na remoção do produto');
        return;
      }

      const remove = cart.filter(removing => removing.id !== productId);
      setCart(remove);
      setLocalStorage(remove);

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const stock = (await api.get(`/stock/${productId}`)).data;

      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }


      const updateProducts = cart.map(product => product.id === productId ? (product = { ...product, amount: amount }) : (product));

      setCart(updateProducts);
      setLocalStorage(updateProducts);

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
