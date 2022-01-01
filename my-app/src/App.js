import './App.css';
import './index.css';
import { useState } from 'react'
import { ethers } from 'ethers'
import { EthereumAuthProvider, SelfID } from '@self.id/web'
import { CeramicClient } from '@ceramicnetwork/http-client'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CreateTwoToneIcon from '@mui/icons-material/CreateTwoTone';
import TextField from '@mui/material/TextField'
import CastConnectedIcon from '@mui/icons-material/CastConnected';
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import CancelIcon from '@mui/icons-material/Cancel';
import BYOF from './BYOF.png';
import { Core } from '@self.id/core'
import { Caip10Link } from '@ceramicnetwork/stream-caip10-link'



function App() {

  const [accountConnected, setAccountConnected] = useState('');
  const [addressToFollow, setAddressToFollow] = useState('');
  const [addressToRead, setAddressToRead] = useState('');
  const [self, setSelf] = useState('')
  const [data, setData] = useState('')
  const [connection, setConnection] = useState(false);
  const [reading, setReading] = useState(false);
  const [writing, setWriting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('');

  const core = new Core({ ceramic: 'http://localhost:7007' })
  const API_URL = 'http://localhost:7007'
  const ceramic = new CeramicClient(API_URL)


  const ColoredLine = ({ color }) => (
    <hr
      style={{
        color,
        backgroundColor: color,
        height: 5,
        margin: 20
      }}
    />
  );

  async function connect() {

    // Connect via metamask
    const [address] = await window.ethereum.request({
      method: 'eth_requestAccounts'
    })

    console.log('connected with Metamask!')

    //Authenticate via 3ID
    await createDid(address)

    console.log('succesfully authenticated via 3ID!')
    setAccountConnected(address);
    setConnection(true)
  }


  async function createDid(addr) {

    const self = await SelfID.authenticate({
      authProvider: new EthereumAuthProvider(window.ethereum, addr),
      ceramic: 'local',
      connectNetwork: 'testnet-clay',
    })
    setSelf(self)
  }

  async function readMyFollowingList() {
    await getData(accountConnected)
  }

  async function readFollowingList() {
    await getData(addressToRead)
  }

  async function getData(addressssssss) {

    const accountLink = await Caip10Link.fromAccount(
      ceramic,
      `${addressssssss}@eip155:1`,
    )

    const linkedDid = accountLink.did

    const profile = await core.get('basicProfile', linkedDid)
    setData(profile)
  }

  async function handleRemove(id) {
    const list = data.followingList
    const newFollowings = list.filter((item) => list.indexOf(item) !== id)

    await self.set('basicProfile', {
      address: accountConnected,
      newFollowing: "",
      followingList: newFollowings
    })

    await getData(accountConnected)
  }


  async function updateFollowingList() {

    if (await ethers.utils.isAddress(addressToFollow)) {

      await getData(accountConnected)

      let followings

      if (data && data.followingList) {
        followings = data.followingList
      }

      else { followings = [] }

      followings.push(addressToFollow)

      await self.set('basicProfile', {
        address: accountConnected,
        newFollowing: addressToFollow,
        followingList: followings
      })

      await getData(accountConnected)

      setWriting(true)
      setErrorMessage('')
    }

    else setErrorMessage('the address you typed is not valid!')

  }

  return (
    <div className="App">
      {!connection && <img className="photo1" src={BYOF} />}
      {connection && <img className="photo2" src={BYOF} />}
      <ColoredLine color="blue" />

      {connection ? <ButtonGroup>
        <Button startIcon={<MenuBookIcon />} color="secondary" variant="contained" onClick={() => { setReading(false); setWriting(true); readMyFollowingList() }}> Read my following List</Button>
        <Button startIcon={<MenuBookIcon />} color="primary" variant="contained" onClick={() => { console.log(accountConnected); setReading(true); setWriting(false); setData('') }} > Read someone else's following list </Button>
      </ButtonGroup> : <Button startIcon={<CastConnectedIcon />} variant="contained" size="large" onClick={connect}>Connect</Button>}


      {connection && <header className="card">
        <h3> {accountConnected} succesfully connected to BYOF </h3>
      </header>}



      {writing && data && data.followingList.length > 0 &&
        <div className="element">
          Here's the accounts you follow :
          <ul>
            {data.followingList.map(item => (
              <ListItem key={data.followingList.indexOf(item)} >
                <Button startIcon={<CancelIcon />} color="secondary" variant="contained" onClick={() => handleRemove(data.followingList.indexOf(item))}> Stop following </Button>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </ul>
        </div>
      }

      {writing && data && data.followingList.length == 0 && <h3> No following accounts on your list, yet ... </h3>}
      {writing && (!data) && <h3> No following accounts on your list, yet ... </h3>}


      {writing &&
        <div className="element">
          <TextField
            variant="filled"
            color="secondary"
            label="Address to follow"
            placeholder="0x00000..."
            onChange={e => setAddressToFollow(e.target.value)}
          />
          <Button startIcon={<CreateTwoToneIcon />} color="primary" variant="contained" onClick={updateFollowingList}> Update your following list </Button>
        </div>
      }

      {reading &&
        <div className="element">
          <TextField
            variant="filled"
            color="secondary"
            label="Address to read"
            placeholder="0x00000..."
            onChange={e => setAddressToRead(e.target.value)}
          />
          <Button startIcon={<CreateTwoToneIcon />} color="primary" variant="contained" onClick={readFollowingList}> Read this account's list </Button>
        </div>
      }

      {reading && data && data.followingList.length > 0 &&
        <div>
          <header className="card"> <h3 className='container'> Here's the accounts followed by {addressToRead} : </h3> </header>
          <ul>
            {data.followingList.map(item => (
              <ListItem key={data.followingList.indexOf(item)} button >
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </ul>
        </div>
      }

      {reading && data && data.followingList.length == 0 && <h3> No accounts followed by {addressToRead}, yet ... </h3>}

      {errorMessage && <h3> {errorMessage} </h3>}
      {/* { writing && <h3> {data.address} has started following {data.newFollowing} </h3>} */}
    </div>

  );
}

export default App;
