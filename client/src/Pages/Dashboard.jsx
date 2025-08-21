import React, { useEffect, useState } from 'react'
import { dummyCreationData } from '../assets/assets'
import { Sparkles } from 'lucide-react'  // ✅ Add this line
import CreationItem from '../Components/CreationItem'

const Dashboard = () => {
  const [creations, setCreations] = useState([])

  const getDashboardData = async () => {
    setCreations(dummyCreationData)
  }

  useEffect(() => {
    getDashboardData()
  }, [])

  return (
    <div className='h-full overflow-y-scroll p-6'>
      <div className='flex justify-start gap-4 flex-wrap'>
        {/* Total Creations Card */}
        <div className='flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200'>
          <div className='text-slate-600'>
            <p className='text-sm'>Total Creations</p>
            <h2 className='text-xl font-semibold'>{creations.length}</h2>
          </div>
          <div className='bg-violet-600 p-2 rounded-full'>
            <Sparkles className='w-5 h-5 text-white' /> {/* ✅ properly imported and used */}
          </div>
        </div>
      </div>

      <div className='space-y-3'>
        <p className='mt-6 mb-4'>Recent Creations</p>
        {
          creations.map((item) => <CreationItem key={item.id} item={item}/>)
        }
      </div>
    </div>
  )
}

export default Dashboard
