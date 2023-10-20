import * as React from "react";
import { Text, StyleSheet, View, Image, ImageBackground } from "react-native";
import { Color, FontFamily, FontSize, Border, Padding,  } from "../../globalstyles";

const Chatbubble = () => {
    return (
      <View style={styles.container}>
         <ImageBackground
        style={styles.bubbleWithVector}
        resizeMode="stretch"
        source={require("../assets/vector3.png")}
      >
        <View style={styles.bubbleL}>
          <Text style={styles.canITalk}>
            {`Can I talk to someone who is currently in their 20s and loves to write poetry and also would love to play CoD ? Can I talk to someone who is currently in their 20s and loves to write poetry and also would love Can I talk to someone who is currently in their 20s and loves to write poetry and also would love `}
          </Text>
          <Text style={styles.pm}>11:57PM</Text>
        </View>
        </ImageBackground>
      </View>
    );
  };
  
  
  const styles = StyleSheet.create({
    pmTypo: {
      textAlign: "left",
      color: Color.fCDDEC,
      fontFamily: FontFamily.interRegular,
    },
    pm: {
      fontSize: FontSize.size_3xs,
      marginBottom: 5,
    }, bubbleWithVector: {
        flexDirection: 'row',
        alignItems: 'center',
      },
    canITalk: {
      fontSize: FontSize.size_sm,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start', // align at the top
        justifyContent: 'flex-end', // Aligns the bubbleContainer to the end/right

        marginBottom: 10, // space between bubbles
      },
      bubbleContainer: {
        flexDirection: 'row',
        alignItems: 'stretch', // ensures children stretch to match the height of the tallest child
      },
      bubbleL: {
        maxWidth: '50%',
        borderTopRightRadius: Border.br_7xs, // adjust for the sender's bubble
        borderTopLeftRadius: Border.br_7xs,
        borderBottomLeftRadius: Border.br_7xs,
        backgroundColor: Color.darkslategray_100,
        flexDirection: "column",
        paddingHorizontal: Padding.p_5xs,
        paddingVertical: Padding.p_9xs,
      },
      vectorIcon: {
        width: 20, // Adjust the width as needed
      },
    chatbubble: {
      //flexDirection: 'row',
      //alignItems: "center",
      //maxWidth: "70%", // maximum width for the chatbubble
    },
  });

export default Chatbubble;
