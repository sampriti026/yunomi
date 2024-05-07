import React, {useState, useEffect} from 'react';
import {Color, FontFamily, FontSize} from '../../globalstyles';
import Nomi from './nomi';
import Chats from './chats';
import Feed from './feed';
import auth from '@react-native-firebase/auth';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import 'react-native-gesture-handler';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {createStackNavigator} from '@react-navigation/stack';
import Topbar from '../components/Topbar';
import {purchaseErrorListener, purchaseUpdatedListener} from 'react-native-iap';
import * as RNIap from 'react-native-iap';
import {removeUserToken} from '../components/storage';

import SubscriptionModal from '../components/subscriptionModel';

const Stack = createStackNavigator();

const Tab = createMaterialTopTabNavigator();

function FrameTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#c599f8',
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontFamily: 'Roboto-Bold',
          fontWeight: '700',
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
        tabBarIndicatorStyle: {
          backgroundColor: '#fff',
        },
      }}
      tabBarPosition="top"
      animationEnabled={true}>
      <Tab.Screen name="Nomi" component={Nomi} />
      <Tab.Screen name="Feed" component={Feed} />
      <Tab.Screen name="Chats" component={Chats} />
    </Tab.Navigator>
  );
}

function FrameTabsScreen({navigation}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [products, setProducts] = useState([]);

  const skus = Platform.select({
    android: [
      'com.yunomi.subscription.monthly', // One-time purchase for one month access
      'com.yunomi.subscription.annual', // Annual subscription
    ],
  });

  useEffect(() => {
    async function initIAP() {
      try {
        await RNIap.initConnection();
        await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
        const items = await RNIap.getSubscriptions({skus});
        setProducts(items);
      } catch (err) {}
    }

    initIAP();

    const purchaseUpdateSub = purchaseUpdatedListener(async purchase => {
      const receipt = purchase.transactionReceipt;
      if (receipt) {
        try {
          // Validate the receipt with your server if necessary
          await RNIap.finishTransaction(purchase);
          Alert.alert(
            'Purchase Successful',
            'You have successfully subscribed to the premium plan.',
          );
        } catch (ackErr) {
          console.warn('ackErr', ackErr);
        }
      }
    });

    const purchaseErrorSub = purchaseErrorListener(error => {
      console.warn('purchaseErrorListener', error);
    });

    return () => {
      purchaseUpdateSub.remove();
      purchaseErrorSub.remove();
      RNIap.endConnection(); // Don't forget to end the connection when you are done!
    };
  }, []);

  const handleBuyPremium = async (productId, offerToken) => {
    try {
      const purchaseOptions = {
        sku: productId,
        ...(offerToken
          ? {subscriptionOffers: [{sku: productId, offerToken}]}
          : {}),
      };

      await RNIap.requestSubscription(purchaseOptions);

      setModalVisible(false); // Close the modal upon initiating the purchase
    } catch (err) {
      console.warn('Purchase failed:', err);
    }
  };

  const signOut = async () => {
    try {
      // Sign out from Firebase
      await auth().signOut();

      // Sign out from Google Signin
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      await removeUserToken(); // Remove token from storage
    } catch (error) {
      console.error('Error signing out:', error.message);
    }

    navigation.navigate('Login');
  };

  return (
    <>
      <Stack.Navigator>
        <Stack.Screen
          name="FrameTabs"
          component={FrameTabs}
          options={{
            title: 'Yunomi',
            headerStyle: {
              backgroundColor: '#c599f8',
            },
            headerTitleStyle: {
              fontSize: FontSize.size_xl,
              letterSpacing: 1,
              fontFamily: FontFamily.latoBold,
              color: Color.fCDDEC,
              fontWeight: '700',
            },
            headerRight: () => (
              <Topbar
                onPressBuyPremium={() => setModalVisible(true)}
                signout={signOut}
              />
            ),
          }}
        />
      </Stack.Navigator>
      <SubscriptionModal
        isVisible={modalVisible}
        products={products}
        onClose={() => setModalVisible(false)}
        onSubscribe={handleBuyPremium}
      />
    </>
  );
}

export default FrameTabsScreen;
