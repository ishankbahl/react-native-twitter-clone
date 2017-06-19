import axios from 'axios';
import cosmicConfig from '../../config/cosmic';
import FormData from 'form-data';
import { Actions } from 'react-native-router-flux';

// Constants
const CREATE_USER = 'CREATE_USER';
const LOGIN = 'LOGIN';

// Action Creators
const createUser = user => ({ type: CREATE_USER, user });
const login = user => ({ type: LOGIN, user });

// Reducer
export default (user = {}, action) => {
  switch (action.type) {
    case CREATE_USER:
      return action.user;
    case LOGIN:
      return action.user;
    default:
      return user;
  }
}

// Helper Function
const formatUser = data => ({
  name: data.object.metadata.name,
  username: data.object.metadata.username,
  profilePicture: data.object.metadata.profile_picture,
  id: data.object._id,
  slug: data.object.slug,
})

// Dispatcher
export const addUser = user => dispatch => {
  let data = new FormData();
  data.append('media', {
        uri: user.image,
        type: 'image/jpeg',
        name: 'image'
      });
  axios.post(`https://api.cosmicjs.com/v1/${cosmicConfig.bucket.slug}/media`, data)
  .then(res => res.data.media)
  .then(media => {
    return axios.post(`https://api.cosmicjs.com/v1/${cosmicConfig.bucket.slug}/add-object`, {
      title: user.firstName + ' ' + user.lastName,
      type_slug: 'users',
      metafields: [
        {
          key: 'name',
          type: 'text',
          value: user.firstName + ' ' + user.lastName,
        },
        {
          key: 'username',
          type: 'text',
          value: user.username,
        },
        {
          key: 'password',
          type: 'text',
          value: user.password,
        },
        {
          key: 'profile_picture',
          type: 'file',
          value: media.name,
              }
            ]
          }
        )}
      )
      .then(res => {
        console.log(res.data)
        return formatUser(res.data)
      })
      .then(formattedUser => dispatch(createUser(formattedUser)))
      .then(() => Actions.feed())
      .catch(err => console.error(`Creating user unsuccessful`, err))
}

export const authenticate = user => dispatch => {
  return axios.get(`https://api.cosmicjs.com/v1/${cosmicConfig.bucket.slug}/object-type/users/search?metafield_key=username&metafield_value=${user.username}`)
    .then(res => res.data)
    .then(data => {
      if (data.objects) {
        const userData = data.objects[0];
        return {
          password: userData.metadata.password,
          username: userData.metadata.username,
          name: userData.metadata.name,
          profilePicture: userData.metadata.profile_picture,
          slug: userData.slug,
          id: userData._id,
        }
      }
    })
    .then(data => {
      if (data.password === user.password){
        dispatch(login({
          name: data.name,
          username: data.username,
          profilePicture: data.profilePicture,
          slug: data.slug,
          id: data.id,
        }))
      } else {
        return 'Username or password invalid';
      }
    })
    .catch(error => console.error('Login unsuccessful', error))
}
