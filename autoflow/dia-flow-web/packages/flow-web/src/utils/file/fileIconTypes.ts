import { ForwardRefExoticComponent, RefAttributes } from 'react'
import { IconComponentProps } from '@ant-design/icons/lib/components/Icon'

export interface IFileIcons {
    [key: string]: ForwardRefExoticComponent<IconComponentProps & RefAttributes<HTMLSpanElement>>
}
