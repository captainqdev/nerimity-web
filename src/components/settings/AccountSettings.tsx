import { createEffect, createSignal, on, onCleanup, onMount, Setter, Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/Button';
import { createUpdatedSignal } from '@/common/createUpdatedSignal';
import SettingsBlock from '@/components/ui/settings-block/SettingsBlock';
import Text from '@/components/ui/Text';
import { css, styled } from 'solid-styled-components';
import { getUserDetailsRequest, updateUser, UserDetails } from '@/chat-api/services/UserService';
import FileBrowser, { FileBrowserRef } from '../ui/FileBrowser';
import { reconcile } from 'solid-js/store';
import Breadcrumb, { BreadcrumbItem } from '../ui/Breadcrumb';
import { t } from 'i18next';
import { Route, Routes, useMatch } from '@solidjs/router';
import { CustomLink } from '../ui/CustomLink';
import { getStorageString, setStorageString, StorageKeys } from '@/common/localStorage';
import socketClient from '@/chat-api/socketClient';

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

type UpdateHeader = Setter<{ username?: string, banner?: string; tag?: string, avatar?: any }>;

export default function AccountSettings(props: { updateHeader: UpdateHeader }) {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Account",
      iconName: 'settings',
    });
  })

  onCleanup(() => {
    props.updateHeader(reconcile({}));
  })

  const isProfilePage = useMatch(() => "app/settings/account/profile")

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title="Dashboard" />
        <BreadcrumbItem title={t('settings.drawer.account')} href='../account' />
        <Show when={isProfilePage()}>
          <BreadcrumbItem title="Profile" />
        </Show>

      </Breadcrumb>

      <Routes>
        <Route path="/" element={<EditAccountPage updateHeader={props.updateHeader} />} />
        <Route path="/profile" element={<EditProfilePage />} />
      </Routes>
    </Container>
  )
}


const ChangePasswordButton = styled("button")`
  color: var(--primary-color);
  background-color: transparent;
  border: none;
  align-self: flex-start;
  cursor: pointer;
  user-select: none;
  &:hover {
    text-decoration: underline;
  }
`

function EditAccountPage(props: { updateHeader: UpdateHeader }) {
  const { account } = useStore();
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal<null | string>(null);
  const [avatarFileBrowserRef, setAvatarFileBrowserRef] = createSignal<undefined | FileBrowserRef>()
  const [bannerFileBrowserRef, setBannerFileBrowserRef] = createSignal<undefined | FileBrowserRef>()

  const [showResetPassword, setShowResetPassword] = createSignal(false);

  const user = () => account.user();

  const defaultInput = () => ({
    email: user()?.email || '',
    username: user()?.username || '',
    tag: user()?.tag || '',
    password: '',
    newPassword: '',
    confirmNewPassword: '',
    avatar: '',
    banner: '',
  })

  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);


  const onSaveButtonClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError(null);

    if (updatedInputValues().newPassword) {
      if (updatedInputValues().newPassword !== updatedInputValues().confirmNewPassword) {
        setError("Confirm password does not match.")
        setRequestSent(false);
        return;
      }
    }


    const values = {...updatedInputValues(), socketId: socketClient.id(), confirmNewPassword: undefined };
    await updateUser(values)
      .then((res) => {
        if (res.newToken) {
          setStorageString(StorageKeys.USER_TOKEN, res.newToken);
          socketClient.updateToken(res.newToken);
        }
        setShowResetPassword(false)
        setInputValue("password", '')
        setInputValue("newPassword", '')
        setInputValue("confirmNewPassword", '')
        setInputValue("avatar", '')
        setInputValue("banner", '')
        props.updateHeader(reconcile({}));
      })
      .catch(err => {
        setError(err.message)
      })
      .finally(() => setRequestSent(false))

  }

  const requestStatus = () => requestSent() ? 'Saving...' : 'Save Changes';


  const onAvatarPick = (files: string[]) => {
    if (files[0]) {
      setInputValue("avatar", files[0])
      props.updateHeader({ avatar: files[0] })

    }
  }
  const onBannerPick = (files: string[]) => {
    if (files[0]) {
      setInputValue("banner", files[0])
      props.updateHeader({ banner: files[0] })

    }
  }

  const onChangePasswordClick = () => {
    setInputValue("newPassword", '')
    setInputValue("confirmNewPassword", '')
    setShowResetPassword(!showResetPassword())
  }

  return (
    <>
      <SettingsBlock icon='email' label='Email'>
        <Input value={inputValues().email} onText={(v) => setInputValue('email', v)} />
      </SettingsBlock>

      <SettingsBlock icon='face' label='Username'>
        <Input value={inputValues().username} onText={(v) => setInputValue('username', v)} />
      </SettingsBlock>

      <SettingsBlock icon='local_offer' label='Tag'>
        <Input class={css`width: 52px;`} value={inputValues().tag} onText={(v) => setInputValue('tag', v)} />
      </SettingsBlock>

      <SettingsBlock icon='wallpaper' label='Avatar'>
        <FileBrowser accept='images' ref={setAvatarFileBrowserRef} base64 onChange={onAvatarPick} />
        <Show when={inputValues().avatar}>
          <Button margin={0} color='var(--alert-color)' iconSize={18} iconName='close' onClick={() => { setInputValue("avatar", ""); props.updateHeader({ avatar: undefined }); }} />
        </Show>
        <Button iconSize={18} iconName='attach_file' label='Browse' onClick={avatarFileBrowserRef()?.open} />
      </SettingsBlock>

      <SettingsBlock icon='panorama' label='Banner'>
        <FileBrowser accept='images' ref={setBannerFileBrowserRef} base64 onChange={onBannerPick} />
        <Show when={inputValues().banner}>
          <Button margin={0} color='var(--alert-color)' iconSize={18} iconName='close' onClick={() => { setInputValue("banner", ""); props.updateHeader({ banner: undefined }); }} />
        </Show>
        <Button iconSize={18} iconName='attach_file' label='Browse' onClick={bannerFileBrowserRef()?.open} />
      </SettingsBlock>

      <SettingsBlock icon='info' label='Profile' description='Edit your bio'>
        <CustomLink href='./profile'>
          <Button iconSize={18} iconName='edit' label='Edit' />
        </CustomLink>
      </SettingsBlock>
      <ChangePasswordButton onClick={onChangePasswordClick} style={{ "margin-bottom": "5px" }}>Change Password</ChangePasswordButton>


      <Show when={showResetPassword()}>
        <SettingsBlock icon='password' label='New Password' description='Changing your password will log you out everywhere else.'>
          <Input type='password' value={inputValues().newPassword} onText={(v) => setInputValue('newPassword', v)} />
        </SettingsBlock>
        <SettingsBlock icon='password' label='Confirm New Password' description='Confirm your new password'>
          <Input type='password' value={inputValues().confirmNewPassword} onText={(v) => setInputValue('confirmNewPassword', v)} />
        </SettingsBlock>
      </Show>


      <Show when={Object.keys(updatedInputValues()).length}>
        <SettingsBlock icon='password' label='Confirm Password'>
          <Input type='password' value={inputValues().password} onText={(v) => setInputValue('password', v)} />
        </SettingsBlock>
      </Show>


      <Show when={error()}><Text size={12} color="var(--alert-color)" style={{ "margin-top": "5px" }}>{error()}</Text></Show>
      <Show when={Object.keys(updatedInputValues()).length}>
        <Button iconName='save' label={requestStatus()} class={css`align-self: flex-end;`} onClick={onSaveButtonClicked} />
      </Show>
    </>
  )
}



const bioBlockStyles = css`
  && {
    height: initial;
    min-height: initial;
    align-items: start;
    flex-direction: column;
    flex: 0;
    padding-top: 15px;
    align-items: stretch;
  }
  .inputContainer {
    margin-left: 35px;
    margin-top: 5px;
  }
  textarea {
    height: 100px;
  }
`;

function EditProfilePage() {
  const { account } = useStore();
  const [userDetails, setUserDetails] = createSignal<UserDetails | null>(null);
  const [error, setError] = createSignal<null | string>(null);
  const [requestSent, setRequestSent] = createSignal(false);

  const defaultInput = () => ({
    bio: userDetails()?.profile?.bio || '',
  })

  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);

  createEffect(on(account.user, (user) => {
    if (!user) return;
    getUserDetailsRequest(account.user()?.id).then(setUserDetails)
  }))

  const requestStatus = () => requestSent() ? 'Saving...' : 'Save Changes';

  const onSaveButtonClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError(null);
    const values = updatedInputValues();
    await updateUser({
      bio: values.bio?.trim() || null
    })
      .then(() => {
        setUserDetails(() => ({ ...userDetails()!, profile: { bio: values.bio } }))
      })
      .catch(err => {
        setError(err.message)
      })
      .finally(() => setRequestSent(false))
  }

  return (
    <>
      <SettingsBlock icon='info' label='Bio' class={bioBlockStyles} description='Multiline and markup support'>
        <Text size={12} style={{ "margin-left": "38px", "margin-top": "5px" }}>({inputValues().bio.length} / 1000)</Text>
        <Input class='inputContainer' type='textarea' value={inputValues().bio} onText={(v) => setInputValue('bio', v)} />
      </SettingsBlock>
      <Show when={error()}><Text size={12} color="var(--alert-color)" style={{ "margin-top": "5px" }}>{error()}</Text></Show>
      <Show when={Object.keys(updatedInputValues()).length}>
        <Button iconName='save' label={requestStatus()} class={css`align-self: flex-end;`} onClick={onSaveButtonClicked} />
      </Show>
    </>
  )
}