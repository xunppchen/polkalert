import React, { useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useMutation } from '@apollo/react-hooks'

import {
  SelectionGroupOption,
  SnackbarType,
  SnackbarThemeInterface
} from 'types'
import CONNECT_MUTATION from 'apollo/mutations/connect'
import { setApiAction } from 'actions'
import { apiSelector } from 'selectors'
import { useBooleanState, useLocalStorage } from 'hooks'
import { LS_NODE_INFO } from 'constants/api'
import { Loading, RadioGroup, Dropdown, Button, Snackbar } from 'ui'

import * as S from './styled'

const SelectApi = () => {
  const dispatch = useDispatch()

  const api = useSelector(apiSelector)
  const [LSNodeUrl, setLSNodeUrl, removeLSNodeUrl] = useLocalStorage(
    LS_NODE_INFO
  )

  const options = [
    'wss://cc3-5.kusama.network/',
    'ws://127.0.0.1:9944',
    'Demo',
    'Custom'
  ]

  const selectedOption = api.demo
    ? 'Demo'
    : LSNodeUrl && options.includes(LSNodeUrl)
    ? LSNodeUrl
    : 'Custom'
  const defaultCustomUrl =
    (selectedOption === 'Custom' && LSNodeUrl) || 'wss://'

  const [apiUrl, setApiUrl] = useState<SelectionGroupOption>(selectedOption)
  const [customApiUrl, setCustomApiUrl] = useState<string>(defaultCustomUrl)
  const [loadingVisible, showLoading, hideLoading] = useBooleanState()
  const [connectMutation] = useMutation(CONNECT_MUTATION)
  const snackbarRef = useRef<SnackbarType>(null)
  const [snackbarTheme, setSnackbarTheme] = useState<SnackbarThemeInterface>({
    text: 'Something went wrong. Please try again.',
    theme: 'error'
  })

  const handleMutationResult = (loaded: boolean, demo: boolean) => {
    dispatch(setApiAction({ loaded, demo }))
    hideLoading()
    if (snackbarRef?.current) snackbarRef.current.open()
  }

  const setApi = () => {
    showLoading()

    const isCustomUrl = apiUrl === 'Custom'
    const url = isCustomUrl ? customApiUrl : (apiUrl as string)

    if (url === 'Demo') {
      setSnackbarTheme({
        text: 'Demo mode activated.',
        theme: 'success'
      })
      removeLSNodeUrl()
      handleMutationResult(true, true)
    } else {
      connectMutation({ variables: { nodeUrl: url } })
        .then(() => {
          setSnackbarTheme({
            text: `Successfully connected to ${url}.`,
            theme: 'success'
          })
          setLSNodeUrl(url)
          handleMutationResult(true, false)
        })
        .catch(() => {
          setSnackbarTheme({
            text:
              'Connection error! Please connect to a node before you continue using Polkalert.',
            theme: 'error'
          })
          removeLSNodeUrl()
          handleMutationResult(false, false)
        })
    }
  }

  const handleKeyUp = e => {
    if (e.keyCode === 13) setApi()
  }

  return (
    <S.Wrapper onKeyUp={handleKeyUp}>
      {loadingVisible && <Loading transparent />}
      <S.Inner>
        <RadioGroup
          id="selectApiRadioGroup"
          value={apiUrl}
          onChange={setApiUrl}
          options={options}
        />
        <Dropdown isOpen={apiUrl === 'Custom'}>
          <S.FormInput
            type="text"
            placeholder="Custom Node URL"
            value={customApiUrl}
            onChange={e => setCustomApiUrl(e.target.value)}
          />
        </Dropdown>
      </S.Inner>
      <Button text="Connect" onClick={setApi} />

      <Snackbar ref={snackbarRef} theme={snackbarTheme.theme}>
        {snackbarTheme.text}
      </Snackbar>
    </S.Wrapper>
  )
}

export default SelectApi
