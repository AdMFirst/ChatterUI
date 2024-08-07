import { ChatWindow } from './ChatWindow/ChatWindow'
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons'
import { Global, Color, Chats, Logger } from '@globals'
import { continueResponse, generateResponse, regenerateResponse } from '@constants/Inference'
import { Stack, useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import {
    View,
    Text,
    TextInput,
    SafeAreaView,
    TouchableOpacity,
    StyleSheet,
    BackHandler,
} from 'react-native'
import { useMMKVString } from 'react-native-mmkv'
import {
    Menu,
    MenuTrigger,
    MenuOptions,
    MenuOption,
    renderers,
    MenuOptionsCustomStyle,
} from 'react-native-popup-menu'
const { SlideInMenu } = renderers
import { useShallow } from 'zustand/react/shallow'
import Recents from './Recents'
import AnimatedView from '@components/AnimatedView'
import SettingsDrawer from './SettingsDrawer'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { SlideInRight, runOnJS, Easing } from 'react-native-reanimated'

const ChatMenu = () => {
    const router = useRouter()
    const [charName, setCharName] = useMMKVString(Global.CurrentCharacter)
    const [newMessage, setNewMessage] = useState<string>('')
    const [showDrawer, setShowDrawer] = useState<boolean>(false)
    const [userName, setUserName] = useMMKVString(Global.CurrentUser)

    const backAction = () => {
        if (showDrawer) {
            setShowDrawer(false)
            Logger.debug('Closing Drawer')
            return true
        }

        if (charName !== 'Welcome') {
            setCharName('Welcome')
            Logger.debug('Returning to primary Menu')
            return true
        }
        BackHandler.exitApp()
    }

    useFocusEffect(
        useCallback(() => {
            BackHandler.removeEventListener('hardwareBackPress', backAction)
            BackHandler.addEventListener('hardwareBackPress', backAction)

            return () => {
                BackHandler.removeEventListener('hardwareBackPress', backAction)
            }
        }, [charName, showDrawer])
    )

    const goToChars = () => {
        if (showDrawer) setShowDrawer(false)
        else router.push('/CharMenu')
    }

    const swipeDrawer = Gesture.Fling()
        .direction(1)
        .onEnd(() => {
            runOnJS(setShowDrawer)(true)
        })

    const swipeChar = Gesture.Fling()
        .direction(3)
        .onEnd(() => {
            runOnJS(goToChars)()
        })

    const gesture = Gesture.Exclusive(swipeDrawer, swipeChar)

    const { insertEntry, deleteEntry, inserLastToBuffer, nowGenerating, abortFunction } =
        Chats.useChat(
            useShallow((state) => ({
                insertEntry: state.addEntry,
                deleteEntry: state.deleteEntry,
                inserLastToBuffer: state.insertLastToBuffer,
                nowGenerating: state.nowGenerating,
                abortFunction: state.abortFunction,
            }))
        )

    const handleSend = async () => {
        if (newMessage.trim() !== '') insertEntry(userName ?? '', true, newMessage)
        insertEntry(charName ?? '', false, '')
        setNewMessage((message) => '')
        generateResponse()
    }

    const abortResponse = async () => {
        Logger.log(`Aborting Generation`)
        if (abortFunction !== undefined) abortFunction()
    }

    const menuoptions = [
        {
            callback: () => {
                setCharName('Welcome')
            },
            text: 'Main Menu',
            button: 'chevron-left',
        },
        {
            callback: () => {
                router.push('/CharInfo')
            },
            text: 'Edit Character',
            button: 'edit',
        },
        {
            callback: () => {
                router.push('/ChatSelector')
            },
            text: 'Chat History',
            button: 'comment',
        },
    ]

    const modificationMenu = (
        <Menu renderer={SlideInMenu}>
            <MenuTrigger>
                <FontAwesome
                    name="cog"
                    style={styles.optionsButton}
                    size={36}
                    color={Color.Button}
                />
            </MenuTrigger>
            <MenuOptions customStyles={menustyle}>
                {menuoptions.map((item, index) => (
                    <MenuOption key={index} onSelect={item.callback}>
                        <View
                            style={
                                index === menuoptions.length - 1
                                    ? styles.optionItemLast
                                    : styles.optionItem
                            }>
                            <FontAwesome
                                style={{ minWidth: 25, marginLeft: 5 }}
                                //@ts-expect-error
                                name={item.button}
                                color={Color.Button}
                                size={24}
                            />
                            <Text style={styles.optionText}>{item.text}</Text>
                        </View>
                    </MenuOption>
                ))}
            </MenuOptions>
        </Menu>
    )

    const headerViewRightSettings = (
        <Animated.View
            entering={SlideInRight.withInitialValues({ originX: 150 })
                .duration(200)
                .easing(Easing.out(Easing.ease))}>
            <TouchableOpacity
                style={styles.headerButtonRight}
                onPress={() => {
                    Logger.log('Unimplemented', true)
                }}>
                <FontAwesome name="cog" size={28} color={Color.Button} />
            </TouchableOpacity>
        </Animated.View>
    )

    const headerViewRight = (
        <View style={styles.headerButtonContainer}>
            {/*charName !== 'Welcome' && (
                <Animated.View
                    entering={SlideInRight.withInitialValues({ originX: 150 })
                        .duration(200)
                        .easing(Easing.out(Easing.ease))}>
                    <View style={styles.headerButtonContainer}>
                        <TouchableOpacity
                            style={styles.headerButtonRight}
                            onPress={() => {
                                setCharName('Welcome')
                            }}>
                            <Ionicons name="chevron-back" size={28} color={Color.Button} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerButtonRight}
                            onPress={() => {
                                router.push('/ChatSelector')
                            }}>
                            <Ionicons name="chatbox" size={28} color={Color.Button} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerButtonRight}
                            onPress={() => router.push(`/CharInfo`)}>
                            <FontAwesome name="edit" size={28} color={Color.Button} />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
                        )*/}
            <Animated.View
                entering={SlideInRight.withInitialValues({ originX: 200 })
                    .duration(200)
                    .easing(Easing.out(Easing.ease))}>
                <TouchableOpacity
                    style={styles.headerButtonRight}
                    onPress={() => {
                        router.push('/CharMenu')
                    }}>
                    <Ionicons name="person" size={28} color={Color.Button} />
                </TouchableOpacity>
            </Animated.View>
        </View>
    )

    const headerViewLeft = (
        <TouchableOpacity
            style={styles.headerButtonLeft}
            onPress={() => {
                setShowDrawer(!showDrawer)
            }}>
            {showDrawer ? (
                <Ionicons name="close" size={28} color={Color.Button} />
            ) : (
                <Ionicons name="menu" size={28} color={Color.Button} />
            )}
        </TouchableOpacity>
    )

    return (
        <GestureDetector gesture={gesture}>
            <SafeAreaView style={styles.safeArea}>
                <Stack.Screen
                    options={{
                        title: '',
                        headerRight: () => !showDrawer && headerViewRight,
                        headerLeft: () => headerViewLeft,
                    }}
                />

                {charName === 'Welcome' ? (
                    <AnimatedView dy={100} tduration={200} fade={0} fduration={100}>
                        <Text style={styles.welcometext}>Select A Character To Get Started!</Text>
                        <Recents />
                    </AnimatedView>
                ) : (
                    <View style={styles.container}>
                        <ChatWindow />

                        <View style={styles.inputContainer}>
                            {modificationMenu}
                            <TextInput
                                style={styles.input}
                                placeholder="Message..."
                                placeholderTextColor={Color.Offwhite}
                                value={newMessage}
                                onChangeText={(text) => setNewMessage(text)}
                                multiline
                            />

                            {nowGenerating ? (
                                <TouchableOpacity style={styles.sendButton} onPress={abortResponse}>
                                    <MaterialIcons name="stop" color={Color.Button} size={30} />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                                    <MaterialIcons name="send" color={Color.Button} size={30} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                <SettingsDrawer booleans={[showDrawer, setShowDrawer]} />
            </SafeAreaView>
        </GestureDetector>
    )
}

const menustyle: MenuOptionsCustomStyle = {
    optionsContainer: {
        backgroundColor: Color.DarkContainer,
        padding: 4,
        borderRadius: 8,
    },
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        flexDirection: 'row',
    },

    welcometext: {
        justifyContent: 'center',
        margin: 40,
        fontSize: 20,
        color: Color.Text,
    },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },

    input: {
        color: Color.Text,
        backgroundColor: Color.DarkContainer,
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 8,
    },

    sendButton: {},

    optionsButton: {},

    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 8,
        borderBottomColor: Color.Offwhite,
        borderBottomWidth: 1,
    },

    optionItemLast: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    optionText: {
        color: Color.Text,
        marginLeft: 16,
    },

    navbar: {
        alignItems: 'center',
        paddingRight: 100,
    },

    headerButtonRight: {
        marginLeft: 20,
        marginRight: 4,
    },

    headerButtonLeft: {
        marginRight: 20,
    },

    headerButtonContainer: {
        flexDirection: 'row',
    },
})

export default ChatMenu
