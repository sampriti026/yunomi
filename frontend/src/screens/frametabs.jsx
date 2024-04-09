import React, {useState, useEffect} from 'react';
import {Color, FontFamily, FontSize} from '../../globalstyles';
import {Modal, Text, View, TouchableOpacity} from 'react-native';
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

import SubscriptionModal from '../components/subscriptionModel';

const Stack = createStackNavigator();

const Tab = createMaterialTopTabNavigator();

function FrameTabs() {
  return (
    <Tab.Navigator
      tabBarOptions={{
        upperCaseLabel: false,
        activeTintColor: Color.fCDDEC,
        inactiveTintColor: Color.gray_700,
        style: {backgroundColor: '#c599f8'},
        indicatorStyle: {backgroundColor: Color.fCDDEC},
        tabBarItem: {pressOpacity: 1},
        labelStyle: {
          fontSize: 12,
          fontFamily: FontFamily.robotoBold,
          fontWeight: '700',
          fontSize: FontSize.size_sm,
        },
      }}
      swipeEnabled={true}
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
        console.log('IAP connection is initialized.');
        await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
        const items = await RNIap.getSubscriptions({skus});
        console.log('Products:', items);
        setProducts(items);
      } catch (err) {
        console.log(err, 'eror in frmtabs');
      }
    }

    initIAP();

    const purchaseUpdateSub = purchaseUpdatedListener(async purchase => {
      console.log('purchaseUpdatedListener', purchase);
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
