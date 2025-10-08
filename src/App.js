import ChatComponent from "./Components/ChatComponent/chatComponent"
import AppProviders from "./AppProvider/AppProvider"
import BulkMessage from "./Components/BulkMessageComponent/bulkMessage.jsx"

export default function App()
{
    return(
      <AppProviders>
        <ChatComponent/>
        {/* <BulkMessage/> */}
      </AppProviders>
    )
}