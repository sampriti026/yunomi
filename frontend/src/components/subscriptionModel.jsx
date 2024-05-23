import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

// Assuming PRODUCT_IDS and fetchProducts are defined elsewhere in your component
const SubscriptionModal = ({isVisible, onClose, onSubscribe, products}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ScrollView>
            <Text style={styles.textStyle}>Paid Features</Text>
            <Text style={styles.subscriptionDetailText}>
              Get unlimited private DMs. Read full chats of everyone.
            </Text>
            {products &&
              products.map((product, productIndex) => (
                <View key={productIndex} style={styles.productContainer}>
                  <Text style={styles.productTitle}>
                    {product.title
                      .replace('(com.yunomi (unreviewed))', '')
                      .trim()}
                  </Text>
                  {product.subscriptionOfferDetails.map((offer, offerIndex) => {
                    const formattedPrice =
                      offer.pricingPhases.pricingPhaseList[0].formattedPrice;
                    let offerLabel =
                      offer.basePlanId === 'premium-onetime'
                        ? 'One-Time'
                        : 'Subscription';
                    return (
                      <TouchableOpacity
                        key={offerIndex}
                        style={styles.offerButton}
                        onPress={() =>
                          onSubscribe(product.productId, offer.offerToken)
                        }>
                        <Text
                          style={
                            styles.offerText
                          }>{`${offerLabel} - ${formattedPrice}`}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            <Text style={styles.subscriptionDetailText}>
              This app can be used without a subscription. With a subscription,
              you get unlimited access to all paid features. Payment will be
              charged to your Google Play account at the confirmation of
              purchase. Subscriptions automatically renew unless canceled at
              least 24 hours before the end of the current period. Manage or
              cancel subscriptions in your Google Play account settings anytime.
            </Text>
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.textStyle}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default SubscriptionModal;

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  subscriptionDetailText: {
    color: 'black',
    textAlign: 'center',
    marginBottom: 20,
  },

  modalView: {
    width: '80%', // Sets modal width to 80% of the screen width
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20, // Reduced padding
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  productContainer: {
    marginBottom: 20,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'black',
  },
  offerButton: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    backgroundColor: '#f0f0f0',
    alignSelf: 'stretch', // Makes button stretch to the width of the modal
    marginBottom: 10,
  },
  offerText: {
    color: 'black',
    textAlign: 'center',
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15,
    alignSelf: 'stretch',
    backgroundColor: '#e0e0e0', // Slightly darker button for cancel
  },
  textStyle: {
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
