import { useNavigation, useRoute } from '@react-navigation/native';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { Alert, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';
import formatValue from '../../utils/formatValue';
import {
  AdditionalsContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  ButtonText,
  Container,
  FinishOrderButton,
  Food,
  FoodContent,
  FoodDescription,
  FoodImageContainer,
  FoodPricing,
  FoodsContainer,
  FoodTitle,
  Header,
  IconContainer,
  PriceButtonContainer,
  QuantityContainer,
  ScrollContainer,
  Title,
  TotalContainer,
  TotalPrice,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
  favorite?: boolean;
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState<Food>({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [foodQuantity, setFoodQuantity] = useState<number>(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      try {
        const foodResponse = await api.get(`/foods/${routeParams.id}`);

        let foodData = foodResponse.data as Food;
        foodData = {
          ...foodData,
          formattedPrice: formatValue(foodData.price),
        };

        setFood(foodData);

        const extrasData = foodData.extras.map(e => ({
          ...e,
          quantity: 0,
        }));

        setExtras(extrasData);

        api.get(`/favorites/${routeParams.id}`).then(favResponse => {
          setIsFavorite(!!favResponse.data);
        });
      } catch (err) {
        Alert.alert('Error on food load details');
      }
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    const extra = extras.find(e => e.id === id);

    if (extra) {
      extra.quantity += 1;
      setExtras([...extras]);
    }
  }

  function handleDecrementExtra(id: number): void {
    const extra = extras.find(e => e.id === id);

    if (extra) {
      extra.quantity = Math.max(extra.quantity - 1, 0);
      setExtras([...extras]);
    }
  }

  function handleIncrementFood(): void {
    setFoodQuantity(value => value + 1);
  }

  function handleDecrementFood(): void {
    setFoodQuantity(value => Math.max(value - 1, 1));
  }

  const toggleFavorite = useCallback(async () => {
    try {
      const favorite = !isFavorite;

      if (favorite) {
        await api.post(`/favorites`, food);
      } else {
        await api.delete(`/favorites/${routeParams.id}`);
      }

      setIsFavorite(favorite);
    } catch {
      Alert.alert('Error on favorite food');
    }
  }, [food, isFavorite, routeParams.id]);

  const cartTotal = useMemo<string>(() => {
    const extraValue = extras.reduce((acc: number, e: Extra) => {
      return acc + e.value * e.quantity;
    }, 0);

    const foodValue = (food.price + extraValue) * foodQuantity;

    return formatValue(foodValue);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    try {
      api.post(`/orders`, food).finally(() => {
        navigation.navigate('Orders');
      });
    } catch (err) {
      Alert.alert('Error on finish order.');
    }
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo<string>(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
