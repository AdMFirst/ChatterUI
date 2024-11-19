import { Chats, MarkdownStyle } from '@globals'
import { usePathname } from 'expo-router'
import React, { useEffect, useRef } from 'react'
import { View } from 'react-native'
import Markdown from 'react-native-markdown-display'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

type ChatTextProps = {
    nowGenerating: boolean
    id: number
}

const ChatText: React.FC<ChatTextProps> = ({ nowGenerating, id }) => {
    const mes = Chats.useChat(
        (state) =>
            state?.data?.messages?.[id]?.swipes?.[state?.data?.messages?.[id].swipe_id ?? -1]
                .swipe ?? ''
    )
    const viewRef = useRef<View>(null)

    const animHeight = useSharedValue(-1)
    const targetHeight = useSharedValue(-1)
    const heightStyle = useAnimatedStyle(() =>
        animHeight.value < 0
            ? {}
            : {
                  height: withTiming(animHeight.value, { duration: 200 }),
              }
    )

    const updateHeight = () => {
        if (viewRef.current) {
            viewRef.current.measure((x, y, width, measuredHeight) => {
                const newHeight = measuredHeight
                if (targetHeight.value === newHeight) return
                animHeight.value = newHeight
                targetHeight.value = newHeight
            })
        }
    }

    useEffect(() => {
        requestAnimationFrame(() => updateHeight())
    }, [mes])

    // TODO: Remove once this is fixed:
    // https://github.com/software-mansion/react-native-reanimated/issues/6659

    const path = usePathname()

    return (
        <Animated.View style={[path === '/' ? heightStyle : {}, { overflow: 'scroll' }]}>
            <View style={{ minHeight: 10 }} ref={viewRef}>
                <Markdown
                    markdownit={MarkdownStyle.Rules}
                    rules={MarkdownStyle.RenderRules}
                    style={MarkdownStyle.Styles}>
                    {mes.trim()}
                </Markdown>
            </View>
        </Animated.View>
    )
}

export default ChatText
