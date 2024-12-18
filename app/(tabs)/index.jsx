import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
// import { useNavigation } from '@react-navigation/native';
import { ArrowUp, X } from 'lucide-react-native';
import { getCartItems, getProducts, clearCart } from '../../components/api/api';
import { categories } from '../../components/api/categories';
import ProductCardLocal from '../../components/myComp/ProductCardLocal';
import ProductCard from '../../components/myComp/ProductCard';
import KeypadModal from '../../components/myComp/KeypadModal';
import CategoryButtons from '../../components/myComp/CategoryButtons';
import LoadingComp from '../../components/myComp/LoadingComp';
import { Link, useNavigation, useRouter } from 'expo-router';

const TingSound = require('../../assets/ting.mp3');

const { width } = Dimensions.get('window');
const productWidth = (width - 48) / 3; // 48 = padding (16 * 2) + gap (16)

function VendingMachine() {
  const [category, setCategory] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [initialLength, setInitialLength] = useState(0);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isChanged, setIsChanged] = useState(false);
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const router = useRouter()

  const { data: products, isLoading: productsLoading, error: productsError, refetch: productRefetch } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      let products = await getProducts();
      const products1 = products?.data?.data?.sort((a, b) => a.productNumber - b.productNumber);
      products.data.data = products1;
      return products;
    },
    staleTime: 10 * 1000,
  });

  const { data: cartItems, isLoading: cartLoading, error: cartError, refetch: cartRefetch } = useQuery({
    queryKey: ['cartItems'],
    queryFn: getCartItems,
  });

  const clearCartMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries(['cartItems']);
      cartRefetch()
    },
  });

  useEffect(() => {
    if (products) {
      setFilteredProducts(filterProducts(products?.data?.data, category, inputValue));
    }
    if (cartItems) {
      setInitialLength(cartItems?.data?.data[0]?.quantity || 0);
    }
  }, [products, category, cartItems, inputValue]);

  useEffect(() => {
    const updateCartCount = async () => {
      const localStorageCart = JSON.parse(await AsyncStorage.getItem('cart')) || [];
      const localStorageCartProductIds = localStorageCart.map(item => item.productId);

      if (cartItems?.data?.data?.length) {
        const fetchedCart = cartItems?.data?.data;
        const fetchedProductIds = fetchedCart.map(item => item.productId._id);

        const uniqueLocalItems = localStorageCart.filter(
          localItem => !fetchedProductIds.includes(localItem.productId)
        );

        const totalCartCount = fetchedCart.length + uniqueLocalItems.length;
        setCartCount(totalCartCount);

        const fetchedQuantitySum = fetchedCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const localQuantitySum = localStorageCart.reduce((sum, item) => sum + (item.quantity || 1), 0);

        setInitialLength(fetchedQuantitySum);
      } else {
        setCartCount(localStorageCart.length);
        const localQuantitySum = localStorageCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setInitialLength(localQuantitySum);
      }
    };

    updateCartCount();
  }, [cartItems, isChanged]);

  useEffect(() => {
    productRefetch();
  }, []);

  const allCarts = async () => {
    // Implement addAllToCart functionality
    router.push("carts");
  };

  const openKeypad = () => {
    setShowModal(true);
  };

  const closeKeypad = () => {
    setShowModal(false);
  };

  const sortByCat = (myCategory) => {
    setCategory(myCategory);
  };

  const filterProducts = (products, category, inputValue) => {
    let filtered = category === '' ? products : products.filter((product) => product.category === category);
    
    if (inputValue) {
      filtered = filtered.filter((product) =>
        product.productNumber.toString()=== inputValue
      );
    }

    return filtered;
  };

  const filterProductsByProductNumber = (number) => {
    setInputValue(number);
  };

  const handleClearCart = async () => {
    const localStorageCart = JSON.parse(await AsyncStorage.getItem('cart')) || [];
    const productsData = products?.data?.data;
    localStorageCart.forEach(cartItem => {
      const product = productsData.find(p => p._id === cartItem.productId);
      if (product) {
        product.stock += cartItem.quantity;
      }
    });

    await AsyncStorage.removeItem('cart');
    setIsChanged(false);
    await clearCartMutation.mutateAsync();
  };

  const renderProductItem = ({ item }) => (
    <View style={styles.productItem}>
      <ProductCard
        clear={clearCartMutation.isPending}
        product={item}
        refetch={{ productRefetch, cartRefetch }}
        myCart={cartItems?.data?.data || []}
        setIsChanged={setIsChanged}
        totalLength={initialLength}
      />
    </View>
  );

  if (productsLoading || cartLoading) {
    return <LoadingComp />;
  }

  if (productsError || cartError) {
    return <Text>Error: {productsError?.message || cartError?.message}</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.logoContainer}>
          <Image source={{ uri: 'https://files.catbox.moe/9ry8ts.png' }} style={styles.logo} />
          <Text style={styles.title}>Vending</Text>
        </TouchableOpacity>
        <View style={styles.navButtons}>
          {(cartItems?.data?.data.length > 0 || isChanged) && (
            <TouchableOpacity onPress={handleClearCart} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
          {/* <TouchableOpacity onPress={allCarts} style={styles.cartButton}>
            <Image source={{ uri: 'https://files.catbox.moe/qb07e6.png' }} style={styles.cartIcon} />
            {(cartItems?.data?.data.length > 0 || isChanged) && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity> */}
          <Link href="/carts"  style={styles.cartButton}>
          <Image source={{ uri: 'https://files.catbox.moe/qb07e6.png' }} style={styles.cartIcon} />
            {(cartItems?.data?.data.length > 0 || isChanged) && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </Link>
        </View>
      </View>

      <CategoryButtons
        categories={categories}
        onCategorySelect={sortByCat}
        activeCategory={category}
      />

      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item._id}
        numColumns={3}
        contentContainerStyle={styles.productList}
      />

<TouchableOpacity onPress={openKeypad} style={styles.keypadButton}>
        <Image source={{ uri: 'https://files.catbox.moe/df4lp3.png' }} style={styles.keypadIcon} />
      </TouchableOpacity>

      {/* Text Bar */}
      {inputValue !== '' && (
  <View style={styles.textBarContainer}>
    {/* Clear Button */}
    <TouchableOpacity style={styles.clearKeypadButton} onPress={() => setInputValue("")}>
      <Text style={styles.clearKeypadButtonText}><X size={32} color={"red"}/></Text>
    </TouchableOpacity>

    {/* Text Display */}
    <TouchableOpacity
      style={styles.textBar}
      onPress={openKeypad} // Trigger KeypadModal when clicked
    >
      <Text style={styles.textBarText}>{inputValue}</Text>
    </TouchableOpacity>
  </View>
)}

      {/* Keypad Modal */}
      <KeypadModal
        visible={showModal}
        onClose={closeKeypad}
        inputValue={inputValue}
        onInputChange={setInputValue}
        productLength={filteredProducts?.length}
        qty={filteredProducts[0]?.qty || 0}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    padding: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 30,
    height: 30,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#f97316',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 16,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cartButton: {
    position: 'relative',
  },
  cartIcon: {
    width: 32,
    height: 32,
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productList: {
    padding: 16,
  },
  productItem: {
    width: productWidth,
    marginBottom: 16,
  },
  scrollTopButton: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    backgroundColor: 'rgba(156, 163, 175, 0.4)',
    borderRadius: 30,
    padding: 12,
  },
  keypadButton: {
    position: 'fixed',
    zIndex:100,
    bottom: 16,
    right: 16,
    backgroundColor: '#f97316',
    borderRadius: 30,
    padding: 12,
  },
  keypadIcon: {
    width: 32,
    height: 32,
  },
  textBarContainer: {
    flexDirection: 'row', // Align items horizontally
    alignItems: 'center', // Vertically center the content
    marginTop: 16,
  },
  // clearButton: {
  //   padding: 16,
  //   backgroundColor: '#dc3545', // Red background for the clear button
  //   borderRadius: 8,
  //   marginRight: 8, // Add space between the clear button and the text
  // },
  // clearButtonText: {
  //   color: 'white',
  //   fontSize: 12,
  //   fontWeight: 'bold',
  // },
  clearKeypadButton: {
    padding: 16,
    // backgroundColor: '#dc3545', // Red background for the clear button
    // borderRadius: 8,
    // marginRight: 8, // Add space between the clear button and the text
  },
  clearKeypadButtonText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  textBar: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 12,
    backgroundColor: '#ddd',
    flex: 1, // Ensure it takes up the remaining space
    alignItems: 'center',
  },
  textBarText: {
    fontSize: 32,
    color: '#333',
  },
});

export default VendingMachine